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
//  sendMessageToNode()                                                                                                         //
// ============================================================================================================================ //
export async function sendMessageToNode(url, schemaId, object) {
  return await sendMessage(url, schemaId, object, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  sendOperatorToOperatorMessage()                                                                                             //
// ============================================================================================================================ //
export async function sendOperatorToOperatorMessage(url, schemaId, object) {
  return await sendMessage(url.replace(/\/?$/, "/operatorMessage"), schemaId, object, SCHEMAS.OP_OP_MESSAGES);
}

// ============================================================================================================================ //
//  sendWalletToOperatorMessage()                                                                                               //
// ============================================================================================================================ //
export async function sendWalletToOperatorMessage(url, schemaId, object) {
  return await sendMessage(url.replace(/\/?$/, "/walletMessage"), schemaId, object, SCHEMAS.WALLET_OP_MESSAGES);
}

// ============================================================================================================================ //
//  sendMessage()                                                                                                               //
// ============================================================================================================================ //
async function sendMessage(url, schemaId, object, collection) {
  let data = schemaSerializer.encodeMessage(schemaId, object, collection),
      b64 = base64.encodeBinary(data, base64.BASE64);

  return new Promise(function(resolve, reject) {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    networkInterface.postRequest(url, JSON.stringify({ data: b64 }), callback, headers);

    function handleBinaryDecoding(responseObject) {

    }

    function callback(success, answer) {
      if(success) {
        try {
          let responseObject = JSON.parse(answer);
          let binary = base64.decodeBinary(responseObject.response, base64.BASE64);
          let [ id, object ] = schemaSerializer.decodeMessage(binary, collection);
          if(id == SCHEMAS.MSG_ANS_ERROR) {
            let error = new CarmentisError(object.error.type | ERROR_TYPES.REMOTE_ERROR, object.error.id, ...object.error.arg);
            reject(error);
          }
          else {
            resolve(object);
          }
        } catch (e) {
          console.error("An error has occurred during the response handling:", e)
          console.error("Received answer:", answer.toString())
          reject(answer)
        }

      }
      else {
        console.error(answer);
        reject(answer);
      }
    }
  });
}
