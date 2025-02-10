import { wiWallet } from "./wiWallet.js";
import { SCHEMAS } from "../../common/constants/constants.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as base64 from "../../common/util/base64.js";
import { CarmentisError } from "../../common/errors/error.js";
import * as crypto from "../../common/crypto/crypto.js";

export class wiExtensionWallet extends wiWallet {
  constructor() {
    super();
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
   * Formats an answer, using the extension wallet format.
   */
  formatAnswer(answerType, object) {
    let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[answerType], object);

    return {
      answerType: answerType,
      answer: base64.encodeBinary(answer, base64.BASE64)
    };
  }
}
