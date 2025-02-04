import { wiWallet } from "./wiWallet.js";
import { SCHEMAS } from "../../common/constants/constants.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as base64 from "../../common/util/base64.js";
import { CarmentisError } from "../../common/errors/error.js";
import * as crypto from "../../common/crypto/crypto.js";

export class wiExtensionWallet extends wiWallet {
  constructor() {
    super(undefined);
  }

  /**
   * Decodes the request data from the provided message and returns the request object.
   *
   * @param {Object} messageData - The message data containing the request and request type.
   * @param {string} messageData.request - The encoded request in base64 format.
   * @param {number} messageData.requestType - The type of the request to be decoded.
   * @return {{type:number}} The decoded request object.
   */
  getRequestFromMessage(messageData) {
    let request = base64.decodeBinary(messageData.request, base64.BASE64),
        requestObject = this.decodeRequest(messageData.requestType, request);

    return requestObject;
  }

  /**
   * Approves the execution of a given request by processing it and returning an encoded response.
   *
   * @param {string} privateKey - The private key used for the approval process.
   * @param {Object} req - The request to be processed.
   * @return {Object} An object containing the encoded response.
   * @return {string} return.answerType - The type of the answer generated after processing the request.
   * @return {string} return.answer - The base64 encoded binary representation of the processed answer.
   */
  approveRequestExecution(privateKey, req) {
    this.privateKey = privateKey;
    this.publicKey =  crypto.secp256k1.publicKeyFromPrivateKey(privateKey);
    let object = this.processRequest(req);

    return {
      answerType: object.answerType,
      answer: base64.encodeBinary(object.answer, base64.BASE64)
    };
  }
}
