import { SCHEMAS } from "../../common/constants/constants";
import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {randomBytes} from "@noble/post-quantum/utils";
import {MessageSerializer, MessageUnserializer} from "../../common/data/messageSerializer";
import {EncoderFactory} from "../../common/utils/encoder";
import {Server, Socket} from "socket.io";

let requests: any = [],
    qrIdentifiers = new Map(),
    walletSocketRequests = new Map();

export class wiServer {

  handleRequest(socket: Socket, type: number, object: any) {

    const containsRequestType = 'requestType' in object;
    const containsRequest = 'request' in object;
    if (!(containsRequest && containsRequestType)) throw new Error('Invalid request');
    switch (type) {
      case SCHEMAS.WIMSG_REQUEST: {
        // the client has sent a request
        // --> send it a first QR code
        let requestId = requests.push({
          type: object.requestType,
          request: object.request,
          clientSocket: socket
        }) - 1;

        return this.refreshQrCode(socket, requestId);
        //break;
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

        return { scheme: SCHEMAS.WIMSG_FORWARDED_REQUEST, message: {requestType: request.type, request: request.request} };
        //this.sendMessage(socket, SCHEMAS.WIMSG_FORWARDED_REQUEST, {requestType: request.type, request: request.request});
        //break;
      }

      case SCHEMAS.WIMSG_ANSWER: {
        // the wallet has sent an answer
        // --> forward it to the client
        let requestId = walletSocketRequests.get(socket.id);
        let request = requests[requestId];

        return { scheme: SCHEMAS.WIMSG_FORWARDED_ANSWER, message: object };
        //this.sendMessage(request.clientSocket, SCHEMAS.WIMSG_FORWARDED_ANSWER, object);
        //break;
      }

      default: throw new Error(`Invalid request type: ${type}`);
    }
  }


  refreshQrCode(socket: Socket, requestId: any) {
    let timestamp = this.getCarmentisTimestamp(),
        qrId = randomBytes(32);

    qrIdentifiers.set(bytesToHex(qrId), requestId);

    return { scheme:  SCHEMAS.WIMSG_UPDATE_QR, message: {qrId: qrId, timestamp: timestamp} }
  }

  sendMessage(socket: Socket, msgId: any, object = {}) {
    const serializer = new MessageSerializer(SCHEMAS.WI_MESSAGES);
    const encoder = EncoderFactory.defaultBytesToStringEncoder();
    let binary = serializer.serialize(msgId, object),
        b64 = encoder.encode(binary);

    socket.emit("data", b64);
  }

  getCarmentisTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

}
