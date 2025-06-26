import * as SCHEMAS from "../../common/constants/schemas";
import {SchemaUnserializer} from "../../common/data/schemaSerializer";
import * as network from "../../common/network/network";
import {PrivateSignatureKey} from "../../common/crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../../common/crypto/signature/signature-encoder";

export abstract class wiWallet<T> {

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

  abstract formatAnswer(answerType: number, object: any): {answerType: number, answer: T};

  /**
   * Signs a request of authentication by public key. Returns the answer in the format expected by the application front.
   *
   * @param {PrivateSignatureKey} privateKey
   * @param object
   * @returns {*}
   */
  signAuthenticationByPublicKey(privateKey: PrivateSignatureKey, object: any) {
    /*
    let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
        signature = crypto.secp256k1.sign(privateKey, object.challenge);
     */
    const challenge = object.challenge;
    const signature = privateKey.sign(challenge);
    const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();

    let answerObject = {
      publicKey: signatureEncoder.encodePublicKey(privateKey.getPublicKey()),
      signature: signatureEncoder.encodeSignature(signature),
    };

    return this.formatAnswer(
      SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
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
