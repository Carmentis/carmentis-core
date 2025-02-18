import { SCHEMAS } from "../../common/constants/constants.js";
import { schemaSerializer } from "../../common/serializers/serializers.js";
import { blockchainCore, ROLES, appLedgerVb, oracleVb } from "../../common/blockchain/blockchain.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as network from "../../common/network/network.js";
import * as uint8 from "../../common/util/uint8.js";
import { CarmentisError } from "../../common/errors/error.js";

const approvalData = new Map();
const oracleData = new Map();

export class operatorCore {
  constructor(nodeUrl, organizationId, privateKey) {
    blockchainCore.setNode(nodeUrl);
    blockchainCore.setUser(ROLES.OPERATOR, privateKey);

    this.privateKey = privateKey;
    this.organizationId = organizationId;
  }

  async initiateOracleRequest(requestObject) {
    console.log("initiateOracleRequest", requestObject);

    try {
      let vb = new oracleVb(requestObject.oracleId);

      await vb.load();

      let data = await vb.encodeServiceRequest(
        requestObject.version,
        requestObject.service,
        requestObject.data,
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

  async receivedOracleRequest(requestObject) {
    console.log("receivedOracleRequest", requestObject);

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

  async confirmOracleRequest(confirmationObject) {
  }

  async prepareUserApproval(approvalObject) {
    // Attempt to create all sections. The resulting microblock is ignored but this is a way to make sure that 'approvalObject'
    // is valid and consistent. We abort the request right away if it's not.
    try {
      let vb;

      if(approvalObject.appLedgerId) {
        vb = new appLedgerVb(approvalObject.appLedgerId);
        await vb.load();
      }
      else {
        vb = new appLedgerVb();
      }

      if(!vb.isEndorserSubscribed(approvalObject.approval.endorser)) {
        // if the endorser does not yet belong to the ledger, create a random actor public key while waiting for the real one
        let endorserActorPrivateKey = crypto.generateKey256(),
            endorserActorPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(endorserActorPrivateKey);

        vb.setEndorserActorPublicKey(endorserActorPublicKey);
      }

      // this will throw an exception if 'approvalObject' is inconsistent
      await vb.generateDataSections(approvalObject, false);

      let mb = vb.getMicroblockData();

      console.log(mb);

      // save 'approvalObject' associated to a random data ID and return this ID to the client
      let dataId = uint8.toHexa(crypto.getRandomBytes(32));

      approvalData.set(dataId, approvalObject);

      return this.successAnswer({
        dataId: dataId
      });
    }
    catch(e) {
      return this.errorAnswer(e);
    }
  }

  approvalHandshake(handshakeObject) {
    try {
      let dataId = uint8.toHexa(handshakeObject.dataId),
          approvalObject = approvalData.get(dataId);

      console.log("approvalHandshake", dataId, approvalObject);
    }
    catch(e) {
      return this.errorAnswer(e);
    }
  }

  successAnswer(data) {
    return {
      success: true,
      error: "",
      data: data
    };
  }

  errorAnswer(e) {
    return {
      success: false,
      error: e.toString(),
      data: {}
    };
  }

  processCatchedError(err) {
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
