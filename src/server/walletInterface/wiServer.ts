import { SCHEMAS } from "../../common/constants/constants";
import {Base64 as base64} from "../../common/data/base64";
import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {randomBytes} from "@noble/post-quantum/utils";
import {MessageSerializer, MessageUnserializer} from "../../common/data/messageSerializer";
import {EncoderFactory} from "../../common/utils/encoder";

let requests: any = [],
    qrIdentifiers = new Map(),
    walletSocketRequests = new Map();

export class wiServer {
  constructor(ioServer: any) {
    ioServer.on("connection", this.onConnect);
  }

  onConnect(socket: any) {
    socket.on("data", onData);

    socket.on("disconnect", (_: any) => {
    });

    function onData(message: any) {

      const schemaSerializer = new MessageUnserializer(SCHEMAS.WI_MESSAGES);
      const encoder = EncoderFactory.defaultBytesToStringEncoder();
      const binary = encoder.decode(message);
      const {type, object} = schemaSerializer.unserialize(binary)

      const containsRequestType = 'requestType' in object;
      const containsRequest = 'request' in object;
      if (!( containsRequest && containsRequestType )) throw new Error('Invalid request');
      switch(type) {
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

          const containsQRId = 'qrId' in object;
          if (!containsQRId) throw new Error('Invalid request: missing qrId');
          let requestId = qrIdentifiers.get(hexToBytes(object.qrId as string));
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

    function refreshQrCode(requestId: any) {
      let timestamp = getCarmentisTimestamp(),
          qrId = randomBytes(32);

      qrIdentifiers.set(bytesToHex(qrId), requestId);

      sendMessage(socket, SCHEMAS.WIMSG_UPDATE_QR, { qrId: qrId, timestamp: timestamp });
    }

    function sendMessage(socket: any, msgId: any, object = {}) {
      const serializer = new MessageSerializer(SCHEMAS.WI_MESSAGES);
      let binary = serializer.serialize(msgId, object),
          b64 = base64.encodeBinary(binary, base64.BASE64);

      socket.emit("data", b64);
    }

    function getCarmentisTimestamp() {
      return Math.floor(Date.now() / 1000);
    }
  }


}
