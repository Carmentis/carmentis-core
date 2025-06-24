import { SCHEMAS } from "../constants/constants";
//import * as schemaSerializer from "../serializers/schema-serializer";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {Base64 as base64} from "../data/base64";

let networkInterface: any,
    lastAnswerId: any;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(intf: any) {
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
export async function sendMessageToNode(url: any, schemaId: any, object: any) {
  return await sendMessage(url, schemaId, object, SCHEMAS.NODE_MESSAGES);
}


// ============================================================================================================================ //
//  sendWalletToOperatorMessage()                                                                                               //
// ============================================================================================================================ //
export async function sendWalletToOperatorMessage(url: any, schemaId: any, object: any) {
  return await sendMessage(url.replace(/\/?$/, "/walletMessage"), schemaId, object, SCHEMAS.WALLET_OP_MESSAGES);
}

// ============================================================================================================================ //
//  sendMessage()                                                                                                               //
// ============================================================================================================================ //
async function sendMessage(url: any, schemaId: any, object: any, schema: any) {
  const serializer = new MessageSerializer(schema)
  let data = serializer.serialize(schemaId, object),
      b64 = base64.encodeBinary(data, base64.BASE64);

  return new Promise(function(resolve, reject) {
    const headers = {
      "Accept": "application/json",
      "Content-Type": "application/json"
    };

    networkInterface.postRequest(url, JSON.stringify({ data: b64 }), callback, headers);

    function handleBinaryDecoding(responseObject: any) {

    }

    function callback(success: any, answer: any) {
      if(success) {
        try {
          let responseObject = JSON.parse(answer);
          let binary = base64.decodeBinary(responseObject.response, base64.BASE64);
          const serializer = new MessageUnserializer(schema)
          // @ts-expect-error TS(2488): Type '{ type: any; object: {}; }' must have a '[Sy... Remove this comment to see the full error message
          let [ id, object ] = serializer.unserialize(binary);


          lastAnswerId = id;

          if(id == SCHEMAS.MSG_ANS_ERROR) {
            // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
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
