import { SCHEMAS, ERRORS } from "../../common/constants/constants.js";
import { schemaSerializer } from "../../common/serializers/serializers.js";
import { blockchainCore, ROLES, appLedgerVb, oracleVb } from "../../common/blockchain/blockchain.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as network from "../../common/network/network.js";
import * as uint8 from "../../common/util/uint8.js";
import { CarmentisError, globalError } from "../../common/errors/error.js";

const approvalData = new Map();
const oracleData = new Map();

export class operatorCore {
  constructor(nodeUrl, organizationId, privateKey) {
    blockchainCore.setNode(nodeUrl);
    blockchainCore.setUser(ROLES.OPERATOR, privateKey);

    this.privateKey = privateKey;
    this.organizationId = organizationId;
  }

  async initiateOracleRequest(req) {
    console.log("initiateOracleRequest", req);

    try {
      let vb = new oracleVb(req.oracleId);

      await vb.load();

      let data = await vb.encodeServiceRequest(
        req.version,
        req.service,
        req.data,
        this.organizationId,
        this.privateKey
      );

      console.log("data", data);

      let answer = await network.sendOperatorToOperatorMessage(
        data.endpoint,
        SCHEMAS.MSG_SUBMIT_ORACLE_REQUEST,
        data.request
      );

      return this.successAnswer({
      });
    }
    catch(e) {
      return this.errorAnswer(e);
    }
  }

  async receivedOracleRequest(req) {
    console.log("receivedOracleRequest", req);

    let requestId = uint8.toHexa(crypto.getRandomBytes(32)),
        price = 1;

    let answer = {
      requestId: requestId,
      price: price
    };

    return schemaSerializer.encodeMessage(
      SCHEMAS.MSG_ANS_SUBMIT_ORACLE_REQUEST,
      answer,
      SCHEMAS.OP_OP_MESSAGES
    );
  }

  async confirmOracleRequest(req) {
  }

  async prepareUserApproval(approvalObject) {
    // Attempt to create all sections. The resulting microblock is ignored but this is a way to make sure that 'approvalObject'
    // is valid and consistent. We abort the request right away if it's not.
    try {
      let vb = await this.loadApplicationLedger(approvalObject.appLedgerId);

      if(!vb.isEndorserSubscribed(approvalObject.approval.endorser)) {
        // if the endorser does not yet belong to the ledger, create a random actor public key while waiting for the real one
        let endorserActorPrivateKey = crypto.generateKey256(),
            endorserActorPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(endorserActorPrivateKey);

        vb.setEndorserActorPublicKey(endorserActorPublicKey);
      }

      // this will throw an exception if 'approvalObject' is inconsistent
      await vb.generateDataSections(approvalObject);

      // save 'approvalObject' associated to a random data ID and return this ID to the client
      let dataId = uint8.toHexa(crypto.getRandomBytes(32));

      approvalData.set(dataId, { approvalObject });

      return this.successAnswer({
        dataId: dataId
      });
    }
    catch(e) {
      return this.errorAnswer(e);
    }
  }

  async approvalHandshake(req) {
    try {
      let storedObject = approvalData.get(req.dataId);

      if(!storedObject) {
        throw "invalid data ID";
      }

      let { approvalObject } = storedObject;

      let vb = await this.loadApplicationLedger(approvalObject.appLedgerId);

      storedObject.vb = vb;

      if(!vb.isEndorserSubscribed(approvalObject.approval.endorser)) {
        return schemaSerializer.encodeMessage(
          SCHEMAS.MSG_ANS_ACTOR_KEY_REQUIRED,
          {
            genesisSeed: vb.state.genesisSeed
          },
          SCHEMAS.WALLET_OP_MESSAGES
        );
      }

      return await this.sendApprovalData(vb, approvalObject);
    }
    catch(e) {
      console.error(e);
    }
  }

  async approvalActorKey(req) {
    try {
      let storedObject = approvalData.get(req.dataId);

      if(!storedObject) {
        throw "invalid data ID";
      }

      if(!storedObject.vb) {
        throw "actor key sent before handshake";
      }

      let { approvalObject, vb } = storedObject;

      vb.setEndorserActorPublicKey(req.actorKey);

      return await this.sendApprovalData(vb, approvalObject);
    }
    catch(e) {
      console.error(e);
    }
  }

  async approvalSignature(req, gasPrice) {
    try {
      let storedObject = approvalData.get(req.dataId);

      if(!storedObject) {
        throw "invalid data ID";
      }

      let { approvalObject, vb } = storedObject;

      await vb.addEndorserSignature(req.signature);

      vb.setGasPrice(gasPrice);
      await vb.signAsAuthor();

      let mb = await vb.publish();

      approvalData.delete(req.dataId);

      return schemaSerializer.encodeMessage(
        SCHEMAS.MSG_ANS_APPROVAL_SIGNATURE,
        {
          vbHash: vb.id,
          mbHash: mb.hash,
          height: mb.header.height
        },
        SCHEMAS.WALLET_OP_MESSAGES
      );
    }
    catch(e) {
      console.error(e);
    }
  }

  async sendApprovalData(vb, approvalObject) {
    try {
      await vb.generateDataSections(approvalObject);

      let mb = vb.getMicroblockData();

      return schemaSerializer.encodeMessage(
        SCHEMAS.MSG_ANS_APPROVAL_DATA,
        {
          data: mb.binary
        },
        SCHEMAS.WALLET_OP_MESSAGES
      );
    }
    catch(e) {
      console.error(e);
    }
  }

  successAnswer(data) {
    return {
      success: true,
      error: "",
      data: data
    };
  }

  async loadApplicationLedger(id) {
    let vb;

    if(id) {
      vb = new appLedgerVb(id);
      await vb.load();
    }
    else {
      vb = new appLedgerVb();
    }
    return vb;
  }

  errorAnswer(e) {
    return {
      success: false,
      error: e.toString(),
      data: {}
    };
  }

  static processCatchedError(err) {
    if(!(err instanceof CarmentisError)) {
      err = new globalError(ERRORS.GLOBAL_INTERNAL_ERROR, err.stack || [ err.toString() ]);
    }

    return schemaSerializer.encodeMessage(
      SCHEMAS.MSG_ANS_ERROR,
      {
        error: {
          type: err.type,
          id  : err.id,
          arg : err.arg.map(String)
        }
      },
      SCHEMAS.OP_OP_MESSAGES
    );
  }
}
