import { SCHEMAS } from "../constants/constants.js";
//import * as schemaSerializer from "../serializers/schema-serializer.js";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer.js";
import {Base64 as base64} from "../data/base64.js";

let networkInterface,
    lastAnswerId;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(intf) {
  networkInterface = intf;
}

// ============================================================================================================================ //
//  getLastAnswerId()                                                                                                           //
// ============================================================================================================================ //
export function getLastAnswerId() {
  return lastAnswerId;
}

// ============================================================================================================================ //
//  sendMessageToNode()                                                                                                         //
// ============================================================================================================================ //
export async function sendMessageToNode(url, schemaId, object) {
  return await sendMessage(url, schemaId, object, SCHEMAS.NODE_MESSAGES);
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
async function sendMessage(url, schemaId, object, schema) {
  const serializer = new MessageSerializer(schema)
  let data = serializer.serialize(schemaId, object),
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
          const serializer = new MessageUnserializer(schema)
          let [ id, object ] = serializer.unserialize(binary);


          lastAnswerId = id;

          if(id == SCHEMAS.MSG_ANS_ERROR) {
            let error = new Error(object.error.type, object.error.id, ...object.error.arg);
            reject(error);
          }
          else {
            resolve(object);
          }
        }
        catch(e) {
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
