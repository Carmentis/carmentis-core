import { ECO, SCHEMAS, ERRORS } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as sectionSerializer from "../serializers/section-serializer.js";
import * as network from "../network/network.js";
import { blockchainError } from "../errors/error.js";

export const ROLES = {
  OBSERVER: 0,
  NODE    : 1,
  OPERATOR: 2,
  USER    : 3
};

export const MB_BATCH_SIZE = 10;

export class blockchainCore {
  static role = ROLES.OBSERVER;
  static rootKey = null;
  static nodeUrl = null;
  static dbInterface = null;
  static chainInterface = null;

  static setUser(role, rootKey) {
    if(!rootKey && (role == ROLES.OPERATOR || role == ROLES.USER)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_NO_ROOT_KEY);
    }

    this.role = role;
    this.rootKey = rootKey;
  }

  static setNode(nodeUrl) {
    this.nodeUrl = nodeUrl;
  }

  static setDbInterface(dbInterface) {
    this.dbInterface = dbInterface;
  }

  static setChainInterface(chainInterface) {
    this.chainInterface = chainInterface;
  }

  static async getVbType(vbHash) {
    let vb = await this.dbGet(SCHEMAS.DB_VB_INFO, vbHash);

    if(!vb) {
      if(this.isNode()) {
        return -1;
      }

      vb = await this.nodeQuery(
        SCHEMAS.MSG_GET_VB_INFO,
        {
          vbHash: vbHash
        }
      );
    }

    return vb.type;
  }

  static async getVbContent(vbHash) {
    let vb = await this.dbGet(SCHEMAS.DB_VB_INFO, vbHash),
        list = vb && await this.getMicroblockList(vb.lastMicroblockHash, vbHash);

    if(!list) {
      if(this.isNode()) {
        throw new blockchainError(ERRORS.BLOCKCHAIN_CANNOT_LOAD_VB, vbHash);
      }

      return await this.nodeQuery(
        SCHEMAS.MSG_GET_VB_CONTENT,
        {
          vbHash: vbHash
        }
      );
    }

    if(!this.isNode()) {
      let newBlocks = await this.nodeQuery(
        SCHEMAS.MSG_GET_NEW_MICROBLOCKS,
        {
          vbHash: vbHash,
          lastKnownHash: vb.lastMicroblockHash
        }
      );

      list = [ ...list, ...newBlocks ];
    }

    return {
      type: vb.type,
      list: list
    }
  }

  static async loadMicroblocks(hashList) {
    return this.isNode() ?
      await this.loadMicroblocksFromChain(hashList)
    :
      await this.loadMicroblocksFromDb(hashList);
  }

  static async loadMicroblocksFromChain(hashList) {
    let list = [];

    for(let mbHash of hashList) {
      let content = await this.chainGet(mbHash);

      list.push([ content, mbHash ]);
    }

    return list;
  }

  static async loadMicroblocksFromDb(hashList) {
    // attempt to get as many micro-blocks as possible from the DB
    let list = [],
        missingHashList = [],
        missingIndex = [];

    for(let n in hashList) {
      let mbHash = hashList[n],
          mb = await this.dbGet(SCHEMAS.DB_MICROBLOCK_DATA, mbHash);

      if(mb) {
        list[n] = [ mb.content, mbHash ];
      }
      else {
        missingHashList.push(mbHash);
        missingIndex.push(n);
      }
    }

    // request missing micro-blocks from the network and save them in the DB
    if(missingHashList.length) {
      let microblockData = await this.nodeQuery(
        SCHEMAS.MSG_GET_MICROBLOCKS,
        {
          list: missingHashList
        }
      );

      for(let i in missingHashList) {
        let content = microblockData.list[i],
            hash = missingHashList[i];

        list[missingIndex[i]] = [ content, hash ];
        await this.dbPut(SCHEMAS.DB_MICROBLOCK_DATA, hash, { content: content });
      }
    }

    return list;
  }

  static async getMicroblockList(currentHash, targetHash) {
    let list = [ currentHash ];

    while(currentHash != targetHash) {
      let mb = await this.dbGet(SCHEMAS.DB_MICROBLOCK_INFO, currentHash);

      if(!mb) {
        return null;
      }

      currentHash = mb.previousHash;
      list.unshift(currentHash);
    }

    return list;
  }

  static computeGas(mbSize) {
    return ECO.FIXED_GAS_FEE + mbSize * ECO.GAS_PER_BYTE;
  }

  static async dbPut(tableId, key, record) {
    if(!this.dbInterface) {
      if(this.isNode()) {
        throw new blockchainError(ERRORS.BLOCKCHAIN_NO_DB_INTERFACE);
      }
      return false;
    }

    let binary = schemaSerializer.encode(SCHEMAS.DB[tableId], record);

    return await this.dbInterface.put(tableId, key, binary);
  }

  static async dbGet(tableId, key) {
    if(!this.dbInterface) {
      if(this.isNode()) {
        throw new blockchainError(ERRORS.BLOCKCHAIN_NO_DB_INTERFACE);
      }
      return null;
    }

    let binary = await this.dbInterface.get(tableId, key);

    if(!binary) {
      return null;
    }

    let record = schemaSerializer.decode(SCHEMAS.DB[tableId], binary);

    return record;
  }

  static async chainPut(hash, data) {
    if(!this.chainInterface) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_NO_CHAIN_INTERFACE);
    }
    await this.chainInterface.writeBlock(hash, data);
  }

  static async chainGet(hash) {
    if(!this.chainInterface) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_NO_CHAIN_INTERFACE);
    }
    return await this.chainInterface.readTx(hash);
  }

  static isNode() {
    return this.role == ROLES.NODE;
  }

  static async nodeQuery(schemaId, object) {
    let answer = await network.sendMessage(this.nodeUrl, schemaId, object);

    return answer;
  }
}
