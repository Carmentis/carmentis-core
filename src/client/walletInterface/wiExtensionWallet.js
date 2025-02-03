import { wiWallet } from "./wiWallet.js";
import { SCHEMAS } from "../../common/constants/constants.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as base64 from "../../common/util/base64.js";
import { CarmentisError } from "../../common/errors/error.js";

export class wiExtensionWallet extends wiWallet {
  constructor(privateKey) {
    super(privateKey);
  }

  getRequestFromMessage(messageData) {
    messageData.request = base64.decodeBinary(messageData.request, base64.BASE64);

    let requestObject = this.decodeRequest(messageData);

    return requestObject;
  }

  approveRequestExecution(req) {
    let object = this.processRequest(req);

    object.answer = base64.encodeBinary(object.answer, base64.BASE64);

    return object;
  }
}
