import { SCHEMAS } from "../../common/constants/constants.js";
import * as base64 from "../../common/util/base64.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";

let io;

// ============================================================================================================================ //
//  setIo()                                                                                                                     //
// ============================================================================================================================ //
export function setIo(module) {
  console.log("setIo", module);
  io = module;
}

// ============================================================================================================================ //
//  getSocket()                                                                                                                 //
// ============================================================================================================================ //
export function getSocket(endpoint, connectCallback, dataCallback) {
  let socket = io(endpoint);

  socket.on("connect", () => {
    if(!socket.connectionInitiated) {
      socket.connectionInitiated = true;
      connectCallback(socket);
    }
  });

  socket.on("data", onData);

  socket.sendMessage = async function(msgId, object = {}) {
    let binary = schemaSerializer.encodeMessage(msgId, object, SCHEMAS.WI_MESSAGES),
        b64 = base64.encodeBinary(binary, base64.BASE64);

    socket.emit("data", b64);
  }

  function onData(message) {
    let binary = base64.decodeBinary(message, base64.BASE64),
        [ id, object ] = schemaSerializer.decodeMessage(binary, SCHEMAS.WI_MESSAGES);

    dataCallback(id, object);
  }

  return socket;
}
