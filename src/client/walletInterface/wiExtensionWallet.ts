import { wiWallet } from "./wiWallet";
import { SCHEMAS } from "../../common/constants/constants";
import {SchemaSerializer} from "../../common/data/schemaSerializer";
//import * as base64 from "../../common/utils/";

//import { CarmentisError } from "../../common/errors/error";
import * as crypto from "../../common/crypto/crypto";
import {Base64 as base64} from "../../common/data/base64";

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
  getRequestFromMessage(messageData: any) {
    let request = base64.decodeBinary(messageData.request, base64.BASE64),
        requestObject = this.decodeRequest(messageData.requestType, request);

    return requestObject;
  }

  /**
   * Formats an answer, using the extension wallet format.
   */
  // @ts-expect-error TS(2425): Class 'wiWallet' defines instance member property ... Remove this comment to see the full error message
  formatAnswer(answerType: any, object: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const schemaSerializer = new SchemaSerializer(SCHEMAS.WI_ANSWERS[answerType])
    let answer = schemaSerializer.serialize(object);

    return {
      answerType: answerType,
      answer: base64.encodeBinary(answer, base64.BASE64)
    };
  }
}
