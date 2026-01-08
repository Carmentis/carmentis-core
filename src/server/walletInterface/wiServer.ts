import {SCHEMAS} from "../../common/constants/constants";
import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {randomBytes} from "@noble/post-quantum/utils";
import {MessageSerializer} from "../../common/data/messageSerializer";
import {EncoderFactory} from "../../common/utils/encoder";
import {Socket} from "socket.io";
import {
  ClientBridgeMessage,
  ClientBridgeMessage_ForwardedAnswer,
  ClientBridgeMessage_ForwardedRequest, ClientBridgeMessage_Request,
  ClientBridgeMessage_UpdateQr,
  ClientBridgeMessageType,
} from "../../common/type/valibot/clientBridge/clientBridgeMessages";
import {ClientBridgeEncoder} from "../../common/type/valibot/clientBridge/ClientBridgeEncoder";

interface MessageSocket  {
  message: ClientBridgeMessage_Request,
  clientSocket: Socket
}

let requests: MessageSocket[] = [],
    qrIdentifiers = new Map(),
    walletSocketRequests = new Map();

export class wiServer {

  handleRequest(socket: Socket, message: ClientBridgeMessage): ClientBridgeMessage {
    console.log("Handling message:", message)
    switch (message.type) {
      case ClientBridgeMessageType.REQUEST: {
        // the client has sent a request
        // --> send it a first QR code
        let requestId = requests.length;
        requests.push({
          message,
          clientSocket: socket
        });

        let timestamp = this.getCarmentisTimestamp(),
            qrId = randomBytes(32);
        const encoder = EncoderFactory.bytesToBase64Encoder();
        const base64QrId = encoder.encode(qrId);

        qrIdentifiers.set(base64QrId, requestId);

        return {
          type: ClientBridgeMessageType.UPDATE_QR,
          base64EncodedQrId: base64QrId,
          timestamp: timestamp
        }
        //1eturn this.refreshQrCode(requestId);
      }

      case ClientBridgeMessageType.CONNECTION_ACCEPTED: {
        // the wallet has accepted the connection
        // --> associate the wallet socket with the request
        // --> send the client request to the wallet

        // TOOD: prevent session hijacking for the same socket id
        let requestId = qrIdentifiers.get(message.base64EncodedQrId);
        let request = requests[requestId];
        walletSocketRequests.set(socket.id, requestId);


        const answer: ClientBridgeMessage_ForwardedRequest = {
          type: ClientBridgeMessageType.FORWARDED_REQUEST,
          walletRequest: request.message.walletRequest,
        }
        return answer;
        //return { scheme: SCHEMAS.WIMSG_FORWARDED_REQUEST, message: {requestType: request.type, request: request.request} };
        //this.sendMessage(socket, SCHEMAS.WIMSG_FORWARDED_REQUEST, {requestType: request.type, request: request.request});
        //break;
      }

      case ClientBridgeMessageType.ANSWER: {
        // the wallet has sent an answer
        // --> forward it to the client
        let requestId = walletSocketRequests.get(socket.id);
        let request = requests[requestId];

        // TODO: check why not forwarded to client socket
        const response: ClientBridgeMessage_ForwardedAnswer = {
          type: ClientBridgeMessageType.FORWARDED_ANSWER,
          walletResponse: message.walletResponse,
        };

        // TODO: why both
        this.sendMessage(request.clientSocket, response)
        return response;
        //return { scheme: SCHEMAS.WIMSG_FORWARDED_ANSWER, message: object };
        //this.sendMessage(request.clientSocket, SCHEMAS.WIMSG_FORWARDED_ANSWER, object);
        //break;
      }
    }

    throw new Error(`Invalid request type: ${message.type}`);
    /*
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

     */
    }

  /*
  refreshQrCode(requestId: number): ClientBridgeMessage_UpdateQr {
    let timestamp = this.getCarmentisTimestamp(),
        qrId = randomBytes(32);

    qrIdentifiers.set(bytesToHex(qrId), requestId);

    return {
      type: ClientBridgeMessageType.UPDATE_QR,
      qrId: qrId,
      timestamp: timestamp
    }
    //return { scheme:  SCHEMAS.WIMSG_UPDATE_QR, message: {qrId: qrId, timestamp: timestamp} }
  }

   */

  sendMessage(socket: Socket, message: ClientBridgeMessage) {
    //const serializer = new MessageSerializer(SCHEMAS.WI_MESSAGES);
    const encoder = EncoderFactory.bytesToBase64Encoder();
    const binary = ClientBridgeEncoder.encode(message); //serializer.serialize(msgId, object),
    const b64 = encoder.encode(binary);
    socket.emit("data", b64);
  }

  getCarmentisTimestamp() {
    return Math.floor(Date.now() / 1000);
  }

}
