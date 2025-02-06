import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as base64 from "../../common/util/base64.js";
import * as uint8 from "../../common/util/uint8.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";

let requests = [],
    qrIdentifiers = new Map(),
    walletSocketRequests = new Map();

export class wiServer {
  constructor(ioServer) {
    ioServer.on("connection", this.onConnect);
  }

  onConnect(socket) {
    socket.on("data", onData);

    socket.on("disconnect", _ => {
    });

    function onData(message) {
      let binary = base64.decodeBinary(message, base64.BASE64),
          [ id, object ] = schemaSerializer.decodeMessage(binary, SCHEMAS.WI_MESSAGES);

      switch(id) {
        case SCHEMAS.WIMSG_REQUEST: {
          // the client has sent a request
          // --> send it a first QR code
          let requestId = requests.push({
            type        : object.requestType,
            request     : object.request,
            clientSocket: socket
          }) - 1;

          refreshQrCode(requestId);
          break;
        }

        case SCHEMAS.WIMSG_CONNECTION_ACCEPTED: {
          // the wallet has accepted the connection
          // --> associate the wallet socket with the request
          // --> send the client request to the wallet
          let requestId = qrIdentifiers.get(uint8.toHexa(object.qrId));
          let request = requests[requestId];

          walletSocketRequests.set(socket.id, requestId);

          sendMessage(socket, SCHEMAS.WIMSG_FORWARDED_REQUEST, { requestType: request.type, request: request.request });
          break;
        }

        case SCHEMAS.WIMSG_ANSWER: {
          // the wallet has sent an answer
          // --> forward it to the client
          let requestId = walletSocketRequests.get(socket.id);
          let request = requests[requestId];

          sendMessage(request.clientSocket, SCHEMAS.WIMSG_FORWARDED_ANSWER, object);
          break;
        }
      }
    }

    function refreshQrCode(requestId) {
      let timestamp = Math.floor(new Date() / 1000),
          qrId = crypto.getRandomBytes(16);

      qrIdentifiers.set(uint8.toHexa(qrId), requestId);

      sendMessage(socket, SCHEMAS.WIMSG_UPDATE_QR, { qrId: qrId, timestamp: timestamp });
    }

    function sendMessage(socket, msgId, object = {}) {
      let binary = schemaSerializer.encodeMessage(msgId, object, SCHEMAS.WI_MESSAGES),
          b64 = base64.encodeBinary(binary, base64.BASE64);

      socket.emit("data", b64);
    }
  }
}
