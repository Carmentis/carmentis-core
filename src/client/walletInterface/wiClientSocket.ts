import { SCHEMAS } from "../../common/constants/constants";
//import * as base64 from "../../common/util/base64";
//import * as schemaSerializer from "../../common/serializers/schema-serializer";

let io: any;

// ============================================================================================================================ //
//  setIo()                                                                                                                     //
// ============================================================================================================================ //
export function setIo(module: any) {
  io = module;
}

// ============================================================================================================================ //
//  getSocket()                                                                                                                 //
// ============================================================================================================================ //
export function getSocket(endpoint: any, connectCallback: any, dataCallback: any) {
  let socket = io(endpoint);
console.log(socket);
  socket.on("connect", () => {
    if(!socket.connectionInitiated) {
      socket.connectionInitiated = true;
      connectCallback(socket);
    }
  });

  socket.on("connect_error", (err: any) => console.error(err));

  socket.on("data", onData);
  socket.on("connect_error", (err: any) => console.error("Connection error", err));

  socket.sendMessage = async function(msgId: any, object = {}) {
    // @ts-expect-error TS(2304): Cannot find name 'schemaSerializer'.
    let binary = schemaSerializer.encodeMessage(msgId, object, SCHEMAS.WI_MESSAGES),
        // @ts-expect-error TS(2304): Cannot find name 'base64'.
        b64 = base64.encodeBinary(binary, base64.BASE64);

    socket.emit("data", b64);
  }

  function onData(message: any) {
    // @ts-expect-error TS(2304): Cannot find name 'base64'.
    let binary = base64.decodeBinary(message, base64.BASE64),
        // @ts-expect-error TS(2304): Cannot find name 'schemaSerializer'.
        [ id, object ] = schemaSerializer.decodeMessage(binary, SCHEMAS.WI_MESSAGES);

    dataCallback(id, object);
  }

  return socket;
}
