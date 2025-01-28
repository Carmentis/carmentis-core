import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as uint8 from "../../common/util/uint8.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import * as web from "../web/web.js";

export class wiClient {
  constructor() {
  }

  attachQrCodeContainer(id) {
    this.qrElement = web.get("#" + id);
  }

  getQrData(id) {
    return web.get("#" + id).getAttribute("qrData");
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  async authenticationByPublicKey(challengeString) {
    let challenge;

    if(challengeString == undefined) {
      challenge = crypto.getRandomBytes(32);
      challengeString = uint8.toHexa(challenge);
    }
    else {
      challenge = uint8.fromHexa(challengeString);
    }

    let answer = await this.request(SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, { challenge: challenge });

    if(!crypto.secp256k1.verify(answer.publicKey, challenge, answer.signature)) {
      throw "invalid signature";
    }

    return {
      challenge: challengeString,
      publicKey: answer.publicKey,
      signature: answer.signature
    };
  }

  async request(type, object) {
    console.log("[client] request", type, object);

    let request = schemaSerializer.encode(SCHEMAS.WI_REQUESTS[type], object);

    let reqObject = {
      requestType: type,
      request    : request,
      deviceId   : new Uint8Array(16),
      withToken  : 0
    };

    let _this = this;

    return new Promise(function(resolve, reject) {
      console.log("[client] opening socket with", _this.serverUrl);
      _this.socket = clientSocket.getSocket(_this.serverUrl, onConnect.bind(_this), onData.bind(_this));

      _this.socket.sendMessage(SCHEMAS.WIMSG_REQUEST, reqObject);

      function onConnect() {
        console.log("[client] connected");
      }

      function onData(id, object) {
        console.log("[client] incoming data", id, object);

        switch(id) {
          case SCHEMAS.WIMSG_UPDATE_QR: {
            let qr = qrCode.create(object.qrId, object.timestamp, _this.serverUrl);

            _this.qrElement.setAttribute("qrData", qr.data);
            _this.qrElement.html(qr.imageTag);
            break;
          }

          case SCHEMAS.WIMSG_FORWARDED_ANSWER: {
            let answerObject = schemaSerializer.decode(SCHEMAS.WI_ANSWERS[object.answerType], object.answer);

            resolve(answerObject);
            break;
          }
        }
      }
    });
  }
}
