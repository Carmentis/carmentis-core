//import { WI } from "#core/constants/constants.js";

let io;

// ============================================================================================================================ //
//  setIo()                                                                                                                     //
// ============================================================================================================================ //
export function setIo(module) {
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

  socket.on("data", dataCallback);

  socket.sendMessage = async function(msgId, obj = {}) {
    let arg = { id: msgId, data: obj };

//    if(msgId & WI.MSG_ACK) {
//      return await new Promise(function(resolve) {
//        socket.emit("data", arg, answer => resolve(answer));
//      });
//    }

    socket.emit("data", arg);
  }

  return socket;
}
