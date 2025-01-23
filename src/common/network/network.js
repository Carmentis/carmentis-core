import { SCHEMAS, ERROR_TYPES } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as base64 from "../util/base64.js";
import { CarmentisError } from "../errors/error.js";

let networkInterface;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(intf) {
  networkInterface = intf;
}

// ============================================================================================================================ //
//  sendMessage()                                                                                                               //
// ============================================================================================================================ //
export async function sendMessage(url, schemaId, object) {
  let data = schemaSerializer.encodeMessage(schemaId, object),
      b64 = base64.encodeBinary(data, base64.BASE64);

  return new Promise(function(resolve, reject) {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    networkInterface.postRequest(url, JSON.stringify({ data: b64 }), callback, headers);

    function callback(success, answer) {
      if(success) {
        let responseObject = JSON.parse(answer),
            binary = base64.decodeBinary(responseObject.response, base64.BASE64);

        let [ id, object ] = schemaSerializer.decodeMessage(binary);

        if(id == SCHEMAS.MSG_ANS_ERROR) {
          let error = new CarmentisError(object.error.type | ERROR_TYPES.REMOTE_ERROR, object.error.id, ...object.error.arg);

          reject(error);
        }
        else {
          resolve(object);
        }
      }
      else {
        console.error(answer);
        reject(answer);
      }
    }
  });
}
