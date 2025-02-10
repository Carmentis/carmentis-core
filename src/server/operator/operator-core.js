import { blockchainCore, ROLES, appLedgerVb, oracleVb } from "../../common/blockchain/blockchain.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as uint8 from "../../common/util/uint8.js";

const dataCache = new Map();

export class operatorCore {
  constructor(nodeUrl, organizationId, privateKey) {
    blockchainCore.setNode(nodeUrl);
    blockchainCore.setUser(ROLES.OPERATOR, operatorPrivateKey);

    this.privateKey = privateKey;
    this.organizationId = organizationId;
  }

  async initiateOracleRequest(requestObject) {
    console.log("initiateOracleRequest", requestObject);

    try {
      let vb = new oracleVb();

      await vb.load(requestObject.oracleId);

      let request = await vb.encodeServiceRequest(
        requestObject.version,
        requestObject.service,
        requestObject.data,
        this.organizationId,
        this.privateKey
      );
    }
    catch(e) {
      return this.error(e);
    }
  }

  async confirmOracleRequest(confirmationObject) {
  }

  async prepareUserApproval(approvalObject) {
    // Attempt to create all sections. The resulting microblock is ignored but this is a way to make sure that 'approvalObject'
    // is valid and consistent. We abort the request right away if it's not.
    try {
      let vb = new appLedgerVb();

      if(approvalObject.appLedgerId) {
        await vb.load(approvalObject.appLedgerId);
      }

      let endorserActorPublicKey;

      if(!vb.isEndorserSubscribed(approvalObject.approval.endorser)) {
        // if the endorser does not yet belong to the ledger, create a random actor public key while waiting for the real one
        let endorserActorPrivateKey = crypto.generateKey256(),
            endorserActorPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(endorserActorPrivateKey);

        vb.setEndorserActorPublicKey(endorserActorPublicKey);
      }

      await vb.generateDataSections(approvalObject, false);

      let mb = vb.getMicroblockData();

      console.log(mb);

      let dataId = uint8.toHexa(crypto.getRandomBytes(32)),
          object = {
            dataId: dataId
          };

      dataCache.set(dataId, object);

      return {
        success: true,
        error: "",
        data: {
          dataId: dataId
        }
      };
    }
    catch(e) {
      return this.error(e);
    }
  }

  error(e) {
    return {
      success: false,
      error: e.toString(),
      data: {}
    };
  }
}
