import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as base64 from "../../common/util/base64.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";

export class wiServer {
  constructor(ioServer) {
    ioServer.on("connection", this.onConnect);
  }

  onConnect(socket) {
    console.log("connection", socket);

    socket.on("data", onData);

    socket.on("disconnect", _ => {
      console.log("disconnected");
    });

    function onData(message) {
      let binary = base64.decodeBinary(message, base64.BASE64),
          [ id, object ] = schemaSerializer.decodeMessage(binary, SCHEMAS.WI_MESSAGES);

      switch(id) {
        case SCHEMAS.WIMSG_REQUEST: {
          refreshQrCode(object.requestType, object.request);
          break;
        }
      }
    }

    function refreshQrCode(requestType, request) {
      let timestamp = Math.floor(new Date() / 1000),
          qrId = crypto.getRandomBytes(16);

      sendMessage(SCHEMAS.WIMSG_UPDATE_QR, { qrId: qrId, timestamp: timestamp });
    }

    function sendMessage(msgId, object = {}) {
      let binary = schemaSerializer.encodeMessage(msgId, object, SCHEMAS.WI_MESSAGES),
          b64 = base64.encodeBinary(binary, base64.BASE64);

      socket.emit("data", b64);
    }
  }
}
