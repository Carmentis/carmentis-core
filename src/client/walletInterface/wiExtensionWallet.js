import { wiWallet } from "./wiWallet.js";
import { SCHEMAS } from "../../common/constants/constants.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import { CarmentisError } from "../../common/errors/error.js";

export class wiExtensionWallet extends wiWallet {
  constructor(privateKey) {
    super(privateKey);
  }

  getRequestFromMessage(messageData) {
    let requestObject = this.decodeRequest(messageData);

    return requestObject;
  }

  approveRequestExecution(req) {
    let answer = this.processRequest(req);

    return answer;
  }
}
