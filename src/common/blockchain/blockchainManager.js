import { ID, SCHEMAS, ERRORS, PROTOCOL } from "../constants/constants.js";
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
import * as util from "../util/util.js";
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
  static async checkMicroblock(mb, options = {}) {
    let ts = options.ts || util.getCarmentisTimestamp();

    let mbHash = crypto.sha256(mb),
        mbObject = schemaSerializer.decode(SCHEMAS.MICROBLOCK, mb),
        state;

    if(mbObject.header.protocolVersion != PROTOCOL.VERSION) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_PROTOCOL_VERSION, PROTOCOL.VERSION, mbObject.header.protocolVersion);
    }

    if(mbObject.header.timestamp < ts - PROTOCOL.MAX_MICROBLOCK_PAST_DELAY) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_TOO_FAR_PAST);
    }

    if(mbObject.header.timestamp > ts + PROTOCOL.MAX_MICROBLOCK_FUTURE_DELAY) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_TOO_FAR_FUTURE);
    }

    if(!options.ignoreGas && mbObject.header.gas != this.computeGas(mb.length)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_INVALID_GAS);
    }

    let mbRecord = {
      previousHash: mbObject.header.previousHash
    };

    if(mbObject.header.height == 1) {
      mbRecord.vbHash = mbHash;
      mbRecord.vbType = parseInt(mbObject.header.previousHash.slice(0, 2), 16);
    }
    else {
      // TODO:
      // The state *SHOULD* be retrieved from the chain rather than re-computed.
      // But this part must be fixed to be compatible with the wallet, which stores
      // neither DB_MICROBLOCK_INFO nor DB_VB_INFO in its database.
      if(this.isNode()) {
        let previousMb = await this.dbGet(SCHEMAS.DB_MICROBLOCK_INFO, mbObject.header.previousHash);
        let vbInfo = await this.dbGet(SCHEMAS.DB_VB_INFO, previousMb.vbHash);

        state = schemaSerializer.decode(SCHEMAS.VB_STATES[previousMb.vbType], vbInfo.state)
        mbRecord.vbHash = previousMb.vbHash;
        mbRecord.vbType = previousMb.vbType;
      }
      else {
        let previousMb = await this.nodeQuery(
          SCHEMAS.MSG_GET_RAW_MICROBLOCK,
          {
            mbHash: mbObject.header.previousHash
          }
        );
        mbRecord.vbHash = previousMb.vbHash;
        mbRecord.vbType = previousMb.vbType;
      }
    }

    let vb;

    if(mbObject.header.height == 1) {
      vb = this.getVbInstance(mbRecord.vbType);
      vb.id = mbHash;
    }
    else {
      vb = this.getVbInstance(mbRecord.vbType, mbRecord.vbHash);
      await vb.load();
//    vb.state = state;
    }

    await vb.importCurrentMicroblock(mb, mbHash);

    let vbRecord = {
      height            : mbObject.header.height,
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

  static getVbInstance(type, id) {
    return new VB_CLASSES[type](id);
  }
}
