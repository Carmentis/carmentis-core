import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";

export class wiWallet {
  constructor(privateKey, uiCallback = async _ => _) {
    this.privateKey = privateKey;
    this.publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey);
    this.uiCallback = uiCallback;
  }

  processQrCode(qrData) {
    let data = qrCode.decode(qrData),
        serverUrl = data.serverUrl.trim();

    console.log("[wallet] opening socket with", serverUrl);
    this.socket = clientSocket.getSocket(serverUrl, onConnect.bind(this), onData.bind(this));

    function onConnect() {
      console.log("[wallet] connected");
      this.socket.sendMessage(SCHEMAS.WIMSG_CONNECTION_ACCEPTED, { qrId: data.qrId });
    }

    async function onData(id, object) {
      console.log("[wallet] incoming data", id, object);

      switch(id) {
        case SCHEMAS.WIMSG_FORWARDED_REQUEST: {
          let requestObject = schemaSerializer.decode(SCHEMAS.WI_REQUESTS[object.requestType], object.request);

          let uiAnswer = await this.uiCallback(object.requestType, requestObject);

          switch(object.requestType) {
            case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
              let signature = crypto.secp256k1.sign(this.privateKey, requestObject.challenge);

              let answerObject = {
                publicKey: this.publicKey,
                signature: signature
              };

              let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY], answerObject);

              this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, answer: answer });
              break;
            }
          }
          break;
        }
      }
    }
  }
}
