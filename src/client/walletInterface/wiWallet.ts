import * as SCHEMAS from "../../common/constants/schemas";
import {SchemaUnserializer} from "../../common/data/schemaSerializer";
import * as network from "../../common/network/network";

export abstract class wiWallet {

  constructor() {
  }

  decodeRequest(requestType: any, request: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_REQUESTS[requestType])
    let requestObject = schemaSerializer.unserialize(request);

    let req = {
      type: requestType,
      object: requestObject
    };

    return req;
  }

  abstract formatAnswer(answerType: any, object: any): {answerType: any, answer: string};

  /**
   * Signs a request of authentication by public key. Returns the answer in the format expected by the application front.
   *
   * @param {PrivateSignatureKey} privateKey
   * @param object
   * @returns {*}
   */
  signAuthenticationByPublicKey(privateKey: any, object: any) {
    /*
    let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
        signature = crypto.secp256k1.sign(privateKey, object.challenge);
     */
    const challenge = object.challenge;
    const signature = privateKey.sign(challenge);
    const publicKey = privateKey.getPublicKey().getRawPublicKey();

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
  async approveGetEmailRequest(email: any) {
    let answerObject = {
      email: email
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_GET_EMAIL,
      answerObject
    );
  }

  async approveGetUserDataRequest(userData: any) {
    let answerObject = {
      userData
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_GET_USER_DATA,
      answerObject
    );
  }

  /**
   * Gets the approval data identified by object.dataId, from the operator at object.serverUrl.*
   *
   * @param {PrivateSignatureKey} privateKey
   * @param object
   * @returns {Promise<*>}
   */
  async getApprovalData(privateKey: any, object: any) {
    /*
    let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
        answer;
     */


    let answer = await network.sendWalletToOperatorMessage(
      object.serverUrl,
      SCHEMAS.MSG_APPROVAL_HANDSHAKE,
      {
        dataId: object.dataId
      }
    );

    if(network.getLastAnswerId() == SCHEMAS.MSG_ANS_ACTOR_KEY_REQUIRED) {
      // @ts-expect-error TS(2304): Cannot find name 'appLedgerVb'.
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

    // @ts-expect-error TS(2571): Object is of type 'unknown'.
    return answer.data;
  }

  /**
   * Sends the signature of the approval data identified by object.dataId to the operator at object.serverUrl.
   * Returns the answer to be sent to the client, which consists of { vbHash, mbHash, height }.
   */
  async sendApprovalSignature(privateKey: any, object: any, signature: any) {
    let answer = await network.sendWalletToOperatorMessage(
      object.serverUrl,
      SCHEMAS.MSG_APPROVAL_SIGNATURE,
      {
        dataId: object.dataId,
        signature: signature
      }
    );

    let answerObject = {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      vbHash: answer.vbHash,
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      mbHash: answer.mbHash,
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      height: answer.height
    };

    return {
      walletObject: answerObject,
      clientAnswer: this.formatAnswer(
        SCHEMAS.WIRQ_DATA_APPROVAL,
        answerObject
      )
    }
  }
}
