import * as http from "http";
import { SCHEMAS, ERROR_TYPES } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import { CarmentisError } from "../errors/error.js";

// ============================================================================================================================ //
//  sendMessage()                                                                                                               //
// ============================================================================================================================ //
export async function sendMessage(url, schemaId, object) {
  let data = schemaSerializer.encodeMessage(schemaId, object);

  return new Promise(function(resolve, reject) {
    let urlObj = new URL(url);

    let options = {
      hostname: urlObj.hostname,
      port    : urlObj.port,
      path    : urlObj.pathname,
      method  : "POST"
    };

    let req = http.request(options, res => {
      res.on("data", answer => {
        let [ id, object ] = schemaSerializer.decodeMessage(new Uint8Array(answer));

        if(id == SCHEMAS.MSG_ANS_ERROR) {
          let error = new CarmentisError(object.error.type | ERROR_TYPES.REMOTE_ERROR, object.error.id, ...object.error.arg);

          reject(error);
        }
        else {
          resolve(object);
        }
      });
    });

    req.on("error", answer => {
      console.error(answer);
      reject(answer);
    });

    req.write(data);
    req.end();
  });
}
