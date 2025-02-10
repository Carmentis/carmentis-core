import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import {CarmentisError} from "../../common/errors/error.js";

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

  getApprovalData(privateKey, object) {
  }
}
