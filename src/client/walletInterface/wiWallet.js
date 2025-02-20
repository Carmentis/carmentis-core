import { SCHEMAS } from "../../common/constants/constants.js";
import { blockchainManager } from "../../common/blockchain/blockchainManager.js";
import { appLedgerVb } from "../../common/blockchain/vb-app-ledger.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as network from "../../common/network/network.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";

export class wiWallet {
  constructor() {
  }

  decodeRequest(requestType, request) {
    let requestObject = schemaSerializer.decode(SCHEMAS.WI_REQUESTS[requestType], request);

    let req = {
      type: requestType,
      object: requestObject
    };

    return req;
  }

  /**
   * Signs a request of authentication by public key. Returns the answer in the format expected by the application front.
   */
  signAuthenticationByPublicKey(privateKey, object) {
    let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
        signature = crypto.secp256k1.sign(privateKey, object.challenge);

    let answerObject = {
      publicKey: publicKey,
      signature: signature
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
      answerObject
    );
  }

  /**
   * Approves a request to get an email by encoding it with the defined schema
   * and sending the encoded message through the socket.
   *
   * @param {string} email - The email address to be approved and processed.
   * @return {Promise<void>} A promise that resolves when the message is successfully sent through the socket.
   */
  async approveGetEmailRequest(email) {
    let answerObject = {
      email: email
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_GET_EMAIL,
      answerObject
    );
  }

  async approveGetUserDataRequest(userData) {
    let answerObject = {
      userData
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_GET_USER_DATA,
      answerObject
    );
  }

  /**
   * Get the approval data from the operator, given the corresponding data identifier.
   */
  async getApprovalData(privateKey, object) {
    let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
        answer;

    answer = await network.sendWalletToOperatorMessage(
      object.serverUrl,
      SCHEMAS.MSG_APPROVAL_HANDSHAKE,
      {
        dataId: object.dataId
      }
    );

    if(network.getLastAnswerId() == SCHEMAS.MSG_ANS_ACTOR_KEY_REQUIRED) {
      let keyPair = appLedgerVb.deriveActorKeyPair(privateKey, answer.genesisSeed);

      answer = await network.sendWalletToOperatorMessage(
        object.serverUrl,
        SCHEMAS.MSG_ACTOR_KEY,
        {
          dataId: object.dataId,
          actorKey: keyPair.publicKey
        }
      );
    }

    if(network.getLastAnswerId() != SCHEMAS.MSG_ANS_APPROVAL_DATA) {
      throw "Failed to retrieve approval data from operator";
    }

    console.log("approval data", answer.data);

    return answer.data;
  }
}
