import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";

export class wiWallet {
  constructor(privateKey) {
    this.privateKey = privateKey;
    this.publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey);
  }

  /**
   * Processes QR code data to establish a socket connection and manage requests.
   *
   * @param {string} qrData The encoded data from the QR code, typically containing server information and an identifier.
   * @return {Promise<{requestType:number, request: Uint8Array}>} A promise that resolves to an object containing information about the request, with a `type` and the parsed `object`.
   */
  async getRequestInfoFromQrCode(qrData) {
    let data = qrCode.decode(qrData),
        serverUrl = data.serverUrl.trim(),
        _this = this;

    return new Promise(function (resolve, reject) {
      console.log("[wallet] opening socket with", serverUrl);
      _this.socket = clientSocket.getSocket(serverUrl, onConnect.bind(_this), onData.bind(_this));

      function onConnect() {
        console.log("[wallet] connected");
        _this.socket.sendMessage(SCHEMAS.WIMSG_CONNECTION_ACCEPTED, { qrId: data.qrId });
      }

      async function onData(id, object) {
        console.log("[wallet] incoming data", id, object);

        switch(id) {
          case SCHEMAS.WIMSG_FORWARDED_REQUEST: {
            let requestObject = schemaSerializer.decode(SCHEMAS.WI_REQUESTS[object.requestType], object.request);

            let req = {
              type: object.requestType,
              object: requestObject
            };

            resolve(req);
            break;
          }
        }
      }
    });
  }

  approveRequestExecution(req) {
    switch(req.type) {
      case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
        let signature = crypto.secp256k1.sign(this.privateKey, req.object.challenge);

        let answerObject = {
          publicKey: this.publicKey,
          signature: signature
        };

        let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY], answerObject);

        this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, answer: answer });
        break;
      }
    }
  }
}
