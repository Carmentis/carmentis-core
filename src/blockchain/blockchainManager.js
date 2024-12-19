import { ID, SCHEMAS, ERRORS } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import { blockchainCore } from "./blockchainCore.js";
import { accountVb } from "./vb-account.js";
import { validatorNodeVb } from "./vb-validator-node.js";
import { organizationVb } from "./vb-organization.js";
import { appUserVb } from "./vb-app-user.js";
import { applicationVb } from "./vb-application.js";
import { appLedgerVb } from "./vb-app-ledger.js";
import { oracleVb } from "./vb-oracle.js";
import * as crypto from "../crypto/crypto.js";
import { blockchainError } from "../errors/error.js";

const VB_CLASSES = {
  [ ID.OBJ_ACCOUNT        ]: accountVb,
  [ ID.OBJ_VALIDATOR_NODE ]: validatorNodeVb,
  [ ID.OBJ_ORGANIZATION   ]: organizationVb,
  [ ID.OBJ_APP_USER       ]: appUserVb,
  [ ID.OBJ_APPLICATION    ]: applicationVb,
  [ ID.OBJ_APP_LEDGER     ]: appLedgerVb,
  [ ID.OBJ_ORACLE         ]: oracleVb
};

export class blockchainManager extends blockchainCore {
  static async addMicroblock(mb) {
    let res = await this.checkMicroblock(mb);

    await res.vb.processNodeCallbacks();

    await this.dbPut(SCHEMAS.DB_MICROBLOCK_INFO, res.mbHash, res.mbRecord);
    await this.dbPut(SCHEMAS.DB_VB_INFO, res.mbRecord.vbHash, res.vbRecord);
    await this.chainInterface.put(res.mbHash, mb);

    return res;
  }

  static async checkMicroblock(mb) {
    let mbHash = crypto.sha256(mb),
        object = schemaSerializer.decode(SCHEMAS.MICROBLOCK, mb),
        state;

    if(object.header.gas != this.computeGas(mb.length)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_GAS);
    }

    let mbRecord = {
      previousHash: object.header.previousHash,
      block: 1,
      index: 0
    };

    if(object.header.height == 1) {
      mbRecord.vbHash = mbHash;
      mbRecord.vbType = parseInt(object.header.previousHash.slice(0, 2), 16);
    }
    else {
      let previousMb = await this.dbGet(SCHEMAS.DB_MICROBLOCK_INFO, object.header.previousHash);
      let vbInfo = await this.dbGet(SCHEMAS.DB_VB_INFO, previousMb.vbHash);

      state = schemaSerializer.decode(SCHEMAS.VB_STATES[previousMb.vbType], vbInfo.state)
      mbRecord.vbHash = previousMb.vbHash;
      mbRecord.vbType = previousMb.vbType;
    }

    let vb = this.getVbInstance(mbRecord.vbType);

    if(object.header.height == 1) {
      vb.id = mbHash;
    }
    else {
      await vb.load(mbRecord.vbHash);
      vb.state = state;
    }

    await vb.importCurrentMicroblock(mb, mbHash);

    let vbRecord = {
      height            : object.header.height,
      type              : mbRecord.vbType,
      lastMicroblockHash: mbHash,
      state             : schemaSerializer.encode(SCHEMAS.VB_STATES[mbRecord.vbType], vb.state)
    };

    return {
      mbHash  : mbHash,
      mbRecord: mbRecord,
      vbRecord: vbRecord,
      vb      : vb
    };
  }

  static getVbInstance(type) {
    return new VB_CLASSES[type];
  }
}
