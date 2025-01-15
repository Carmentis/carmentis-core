import * as crypto from "../crypto/crypto.js";
import * as uint8 from "../util/uint8.js";

const CACHE_HORIZON       = 2;
const HASH_SIZE           = 32;
const ROOT_ANCHORING_HASH = new Uint8Array(HASH_SIZE);

function debug(array) {
  return [...array].map(n => n.toString(16).toUpperCase().padStart(2, 0)).join('');
}

// ============================================================================================================================ //
//  Radix trees                                                                                                                 //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  This structure is used to:                                                                                                  //
//  - store the hash of the last micro-block of each virtual blockchain, given the hash of the genesis block as the key         //
//  - store the hash of the state of each account (from DB_ACCOUNT_STATE), given the hash of the account virtual blockchain as  //
//    the key                                                                                                                   //
//                                                                                                                              //
//  The key hash is split into nibbles. So, each node may have up to 16 children. Each node in the tree is identified by its    //
//  hash. We use an 'early leaf node' when there's only one remaining path.                                                     //
//                                                                                                                              //
//  Standard node:                                                                                                              //
//    BITMASK (2 bytes) : non-zero bit-mask of active child nodes                                                               //
//    for each active child (from LSB to MSB):                                                                                  //
//      HASH (32 bytes) : hash of child node, or target value if this is the deepest level (*)                                  //
//    end                                                                                                                       //
//                                                                                                                              //
//  Early leaf node:                                                                                                            //
//    BITMASK (2 bytes)       : set to 0x0000                                                                                   //
//    TRAILING_PATH (N bytes) : the remaining nibbles in the path, packed in the nearest number of bytes                        //
//    VALUE (32 bytes)        : target value                                                                                    //
//                                                                                                                              //
//  (*) Although this case is supported, it will never happen in practice. (For it would mean that we have two hashes that are  //
//      identical up to the penultimate nibble, which is almost as unlikely as a full hash collision.)                          //
// ============================================================================================================================ //

// ============================================================================================================================ //
//  newTree()                                                                                                                   //
// ============================================================================================================================ //
export function newTree(database, subId) {
  let storage = getStorageInstance(new Map(), new Map(), database, subId);

  return {
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  set()                                                                                                                   //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Sets a (key, value) pair.                                                                                               //
    // ------------------------------------------------------------------------------------------------------------------------ //
    set: async function(key, value) {
      await writeTree(storage, key, value);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  get()                                                                                                                   //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Given a key, returns the corresponding value.                                                                           //
    // ------------------------------------------------------------------------------------------------------------------------ //
    get: async function(key) {
      return await readTree(storage, key);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  rollback()                                                                                                              //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Cancels all updates defined in the batch.                                                                               //
    // ------------------------------------------------------------------------------------------------------------------------ //
    rollback: async function() {
      return await storage.rollback();
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getRootHash()                                                                                                           //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Returns the root hash of the tree.                                                                                      //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getRootHash: async function() {
      return await storage.getRootHash();
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  flush()                                                                                                                 //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Commits the current batch to the database and returns the root hash.                                                    //
    // ------------------------------------------------------------------------------------------------------------------------ //
    flush: async function() {
      return await storage.flush();
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getEntries()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Debugging method.                                                                                                       //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getEntries: async function() {
      function hexa(a) {
        return a.map(v => v.toString(16).toUpperCase().padStart(2, 0)).join('');
      }

      let iterator = database.query(subId),
          list = [];

      for await(let e of iterator) {
        let msk = e[1][0] << 8 | e[1][1];

        list.push(
          hexa([...e[0]]) + ": " + (
            e[0].some(v => v) ?
              msk.toString(2).padStart(16, 0) + " " + (
                msk ?
                  hexa([...e[1]].slice(2)).match(RegExp(`.{${HASH_SIZE * 2}}`, 'g')).join(' ')
                :
                  hexa([...e[1]].slice(2)).replace(RegExp(`(.*)(.{${HASH_SIZE * 2}})$`), "$1 $2")
              )
            :
              hexa([...e[1]])
          )
        );
      }
      return list;
    }
  }
}

// ============================================================================================================================ //
//  getStorageInstance()                                                                                                        //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Three different components are used to store the tree:                                                                      //
//    - the database, where everything is eventually stored                                                                     //
//    - cache: in-memory storage for the first few levels of the tree                                                           //
//    - batch: keeps track of updates that were performed in the current batch but are not yet committed to the DB              //
// ============================================================================================================================ //
function getStorageInstance(cache, batch, database, subId) {
  // ========================================================================================================================== //
  //  get()                                                                                                                     //
  // ========================================================================================================================== //
  async function get(depth, hash) {
    let hashString = uint8.toHexa(hash),
        value = cache.get(hashString);

    if(value === undefined) {
      // ---------------------------------------------------------------------------------------------------------------------- //
      //  the value was not found in the cache: get it from the DB and update the cache if we're within the cache horizon       //
      // ---------------------------------------------------------------------------------------------------------------------- //
      value = await database.get(subId, hash);

      if(value !== undefined && depth <= CACHE_HORIZON) {
        cache.set(hashString, value);
      }
    }

    if(value === undefined || value === null) {
      if(hash.some(v => v)) {
        console.log(value);
        throw `failed to get hash ${hashString} from storage`;
      }
      else {
        value = ROOT_ANCHORING_HASH;
      }
    }

    return value;
  }

  // ========================================================================================================================== //
  //  set()                                                                                                                     //
  // ========================================================================================================================== //
  function set(depth, hash, value) {
    let hashString = uint8.toHexa(hash);

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  update the cache                                                                                                        //
    // ------------------------------------------------------------------------------------------------------------------------ //
    cache.set(hashString, value);

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  update the batch                                                                                                        //
    // ------------------------------------------------------------------------------------------------------------------------ //
    if(value === null && batch.get(hashString) !== undefined) {
      // ---------------------------------------------------------------------------------------------------------------------- //
      //  the entry is to be deleted and was set during the current batch: discard it entirely                                  //
      // ---------------------------------------------------------------------------------------------------------------------- //
//console.log('batch delete', hashString);
      batch.delete(hashString);
    }
    else {
//console.log('batch set', hashString, value === null ? 'null' : 'value');
      batch.set(hashString, value);
    }
  }

  // ========================================================================================================================== //
  //  remove()                                                                                                                  //
  // ========================================================================================================================== //
  function remove(depth, hash) {
    set(depth, hash, null);
  }

  // ========================================================================================================================== //
  //  getRootHash()                                                                                                             //
  // ========================================================================================================================== //
  async function getRootHash() {
    let rootHash = await get(-1, ROOT_ANCHORING_HASH);

    return rootHash;
  }

  // ========================================================================================================================== //
  //  flush()                                                                                                                   //
  // ========================================================================================================================== //
  async function flush() {
//console.log('flush', batch);
    let dbBatch = database.batch(),
        deleteList = [],
        putList = [];

    for(let [ hashString, value ] of batch) {
      let key = uint8.fromHexa(hashString);

      if(value === null) {
        deleteList.push(key);
      }
      else {
        putList.push([ key, value ]);
      }
    }

    batch = new Map();

    let rootHash = await get(-1, ROOT_ANCHORING_HASH);

    dbBatch.del(subId, deleteList);
    dbBatch.put(subId, putList);
    await dbBatch.write();

    // TODO: clear the cache beyond the horizon

    return rootHash;
  }

  // ========================================================================================================================== //
  //  rollback()                                                                                                                //
  // ========================================================================================================================== //
  async function rollback() {
    // for each key defined in the batch, delete the corresponding cache entry to force it to be reloaded from the DB
    for(let [ hashString, value ] of batch) {
      cache.delete(hashString);
    }

    // reset the batch
    batch = new Map();
  }

  return {
    get        : get,
    set        : set,
    remove     : remove,
    getRootHash: getRootHash,
    flush      : flush,
    rollback   : rollback
  };
}

// ============================================================================================================================ //
//  writeTree()                                                                                                                 //
// ============================================================================================================================ //
async function writeTree(storage, key, value, nodeHash) {
  async function write(key, value, nodeHash, depth) {
    if(depth == HASH_SIZE * 2) {
      return value;
    }

    let node = nodeHash && await storage.get(depth, nodeHash),
        len = HASH_SIZE * 2 + 1 - depth >> 1;

//console.log('node', nodeHash && debug(nodeHash));
    if(node) {
//console.log('node exists');
      // ---------------------------------------------------------------------------------------------------------------------- //
      //  the node already exists                                                                                               //
      // ---------------------------------------------------------------------------------------------------------------------- //
      let msk = node[0] << 8 | node[1],
          nibble = key[depth >> 1] >> 4 * (depth & 1) & 0xF,
          update = 0,
          hashList;

      if(msk) {
//console.log('already standard');
        // -------------------------------------------------------------------------------------------------------------------- //
        //  this is already a standard node --> get the list of hashes of child nodes and update the node                       //
        // -------------------------------------------------------------------------------------------------------------------- //
        hashList = getHashList(msk, node);
        update = 1;
      }
      else {
        // -------------------------------------------------------------------------------------------------------------------- //
        //  this is an early leaf node --> test whether this is the same key                                                    //
        // -------------------------------------------------------------------------------------------------------------------- //
        if(keyDifference(depth, key, node)) {
//console.log('early leaf / different key');
          // ------------------------------------------------------------------------------------------------------------------ //
          //  this is not the same key --> turn this node into a standard node with a single child and update the node          //
          // ------------------------------------------------------------------------------------------------------------------ //
          let prevKey = new Uint8Array(HASH_SIZE),
              prevValue = node.slice(2 + len, 2 + HASH_SIZE + len),
              index = node[2] >> 4 * (depth & 1) & 0xF;

          prevKey.set(node.slice(2, 2 + len), HASH_SIZE - len);

          hashList = Array(16).fill(null);
          hashList[index] = await write(prevKey, prevValue, null, depth + 1);
          msk = 1 << index;
          update = 1;
        }
        else {
//console.log('early leaf / same key');
          // ------------------------------------------------------------------------------------------------------------------ //
          //  this is the same key --> just update the target hash                                                              //
          // ------------------------------------------------------------------------------------------------------------------ //
          node.set(value, 2 + len);
        }
      }

      if(update) {
        // -------------------------------------------------------------------------------------------------------------------- //
        //  the node is now guaranteed to be a standard one and an update is required                                           //
        // -------------------------------------------------------------------------------------------------------------------- //
        hashList[nibble] = await write(key, value, hashList[nibble], depth + 1);

        let nHash = hashList.reduce((p, c) => p + (c != null), 0);

        node = new Uint8Array(2 + HASH_SIZE * nHash);

        msk |= 1 << nibble;
        node[0] = msk >> 8;
        node[1] = msk;

        let ptr = 2;

        for(let i = 0; i < 16; i++) {
          if(msk & 1 << i) {
            node.set(hashList[i], ptr);
            ptr += HASH_SIZE;
          }
        }
      }
    }
    else {
//console.log('node does not exist -> new early leaf');
      // ---------------------------------------------------------------------------------------------------------------------- //
      //  the node does not exist --> create an early leaf node                                                                 //
      // ---------------------------------------------------------------------------------------------------------------------- //
      node = new Uint8Array(2 + HASH_SIZE + len);
      node.set(key.slice(depth >> 1), 2);

      if(depth & 1) {
        // -------------------------------------------------------------------------------------------------------------------- //
        //  odd depth --> because we may get an exact copy of a previous early leaf node that was just turned into a standard   //
        //  node at depth - 1, we XOR the unused nibble in the key with 0xF to make sure that we'll get a different hash        //
        // -------------------------------------------------------------------------------------------------------------------- //
        node[2] ^= 0xF;
      }

      node.set(value, 2 + len);
    }

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  remove the previous entry / save the new one                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    if(nodeHash) {
      storage.remove(depth, nodeHash);
    }

    let newHash = (crypto.sha256(node)).slice(0, HASH_SIZE);
//console.log('hash', debug(newHash), debug(node));
    storage.set(depth, newHash, node);

    return newHash;
  }

  let rootHash = await storage.get(-1, ROOT_ANCHORING_HASH),
      newRootHash = await write(key, value, rootHash, 0);

  storage.set(-1, ROOT_ANCHORING_HASH, newRootHash);
}

// ============================================================================================================================ //
//  readTree()                                                                                                                  //
// ============================================================================================================================ //
async function readTree(storage, key) {
  async function read(key, nodeHash, depth) {
    if(depth == HASH_SIZE * 2) {
      return nodeHash;
    }

    let node = nodeHash && await storage.get(depth, nodeHash);

    if(!node) {
      throw "missing node in radix tree";
    }

    proof.push(node);

    let msk = node[0] << 8 | node[1];

    if(msk) {
      let hashList = getHashList(msk, node),
          nibble = key[depth >> 1] >> 4 * (depth & 1) & 0xF;

      return msk & 1 << nibble ? await read(key, hashList[nibble], depth + 1) : false;
    }

    if(keyDifference(depth, key, node)) {
      return false;
    }

    let len = HASH_SIZE * 2 + 1 - depth >> 1;

    return node.slice(2 + len);
  }

  let rootHash = await storage.get(-1, ROOT_ANCHORING_HASH),
      proof = [],
      res = await read(key, rootHash, 0);

  return [ res, proof ];
}

// ============================================================================================================================ //
//  verifyProof()                                                                                                               //
// ============================================================================================================================ //
export async function verifyProof(key, value, proof) {
  async function verify(key, nodeHash, depth) {
    if(depth == HASH_SIZE * 2) {
      return uint8.isEqual(nodeHash, value);
    }

    let node = proof[depth];

    if(depth && !uint8.isEqual(crypto.sha256(node), nodeHash)) {
      return false;
    }

    let msk = node[0] << 8 | node[1];

    if(msk) {
      let hashList = getHashList(msk, node),
          nibble = key[depth >> 1] >> 4 * (depth & 1) & 0xF;

      return msk & 1 << nibble ? await verify(key, hashList[nibble], depth + 1) : value === false;
    }

    if(keyDifference(depth, key, node)) {
      return value === false;
    }

    let len = HASH_SIZE * 2 + 1 - depth >> 1;

    return uint8.isEqual(node.slice(2 + len), value);
  }

  return await verify(key, null, 0) && crypto.sha256(proof[0]);
}

// ============================================================================================================================ //
//  keyDifference()                                                                                                             //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Tests whether the trailing key stored in an early leaf node is different from the key that's being processed.               //
// ============================================================================================================================ //
function keyDifference(depth, key, node) {
  for(let n = depth; n < HASH_SIZE * 2; n++) {
    if((key[n >> 1] ^ node[2 + (n >> 1) - (depth >> 1)]) >> 4 * (n & 1) & 0xF) {
      return 1;
    }
  }
  return 0;
}

// ============================================================================================================================ //
//  getHashList()                                                                                                               //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Extracts all hashes stored in a standard node and return them as a list. Empty slots are filled with null.                  //
// ============================================================================================================================ //
function getHashList(msk, node) {
  let hashList = [],
      ptr = 2;

  for(let i = 0; i < 16; i++) {
    hashList.push(msk & 1 << i ? node.slice(ptr, ptr += HASH_SIZE) : null);
  }

  return hashList;
}
