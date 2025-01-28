import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
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

  async authenticationByPublicKey() {
    let challenge = crypto.getRandomBytes(32);

    return await this.request(SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, { challenge: challenge });
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

    this.socket = clientSocket.getSocket(this.serverUrl, onConnect.bind(this), onData.bind(this));

    this.socket.sendMessage(SCHEMAS.WIMSG_REQUEST, reqObject);

    function onConnect() {
      console.log("[client] connected");
    }

    function onData(id, object) {
      console.log("[client] incoming data", id, object);

      switch(id) {
        case SCHEMAS.WIMSG_UPDATE_QR: {
          let qr = qrCode.create(object.qrId, object.timestamp, this.serverUrl);

          this.qrElement.setAttribute("qrData", qr.data);
          this.qrElement.html(qr.imageTag);
          break;
        }
      }
    }
  }
}
