import { RADIX_CST } from "./radixConstants.js";
import { Utils } from "../utils/utils.js";

/**
  Three different components are used to store the tree:
    - the database, where everything is eventually stored
    - cache: in-memory storage for the first few levels of the tree
    - batch: keeps track of updates that were performed in the current batch but are not yet committed to the DB
*/
export class RadixStorage {
  constructor(database, subId) {
    this.cache = new Map();
    this.batch = new Map();
    this.database = database;
    this.subId = subId;
  }

  async get(depth, hash) {
    const hashString = Utils.binaryToHexa(hash);
    let value = this.cache.get(hashString);

    if(value === undefined) {
      // the value was not found in the cache: get it from the DB and update the cache if we're within the cache horizon
      value = await this.database.getRaw(this.subId, hash);

      if(value !== undefined && depth <= RADIX_CST.CACHE_HORIZON) {
        this.cache.set(hashString, value);
      }
    }

    if(value === undefined || value === null) {
      if(hash.some((v) => v)) {
        console.log(value);
        throw `failed to get hash ${hashString} from storage`;
      }
      else {
        value = RADIX_CST.ROOT_ANCHORING_HASH;
      }
    }

    return value;
  }

  set(depth, hash, value) {
    const hashString = Utils.binaryToHexa(hash);

    // update the cache
    this.cache.set(hashString, value);

    // update the batch
    if(value === null && this.batch.get(hashString) !== undefined) {
      // the entry is to be deleted and was set during the current batch: discard it entirely
//console.log('batch delete', hashString);
      this.batch.delete(hashString);
    }
    else {
//console.log('batch set', hashString, value === null ? 'null' : 'value');
      this.batch.set(hashString, value);
    }
  }

  /**
    a removed item is set to null so that we know that it must be actually deleted when flush() is called
  */
  remove(depth, hash) {
    this.set(depth, hash, null);
  }

  async getRootHash() {
    return await this.get(-1, RADIX_CST.ROOT_ANCHORING_HASH);
  }

  async setRootHash(rootHash) {
    await this.set(-1, RADIX_CST.ROOT_ANCHORING_HASH, rootHash);
  }

  async flush() {
//console.log('flush', batch);
    const dbBatch = this.database.getBatch();
    const deleteList = [];
    const putList = [];

    for(const [ hashString, value ] of this.batch) {
      const key = Utils.binaryFromHexa(hashString);

      if(value === null) {
        deleteList.push(key);
      }
      else {
        putList.push([ key, value ]);
      }
    }

    this.resetBatch();

    const rootHash = await this.getRootHash();

    dbBatch.del(this.subId, deleteList);
    dbBatch.put(this.subId, putList);
    await dbBatch.write();

    // TODO: clear the cache beyond the horizon

    return rootHash;
  }

  async rollback() {
    // for each key defined in the batch, delete the corresponding cache entry to force it to be reloaded from the DB
    for(const [ hashString, value ] of this.batch) {
      this.cache.delete(hashString);
    }

    this.resetBatch();
  }

  resetBatch() {
    this.batch = new Map();
  }
}
