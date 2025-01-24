import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import * as web from "../web/web.js";

export class wiClient {
  attachQrCodeContainer(id) {
    this.qrElement = web.get("#" + id);
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  process() {
    let socket = clientSocket.getSocket(this.serverUrl, this.onConnect, this.onData);
  }

  onConnect() {
    console.log("onConnect");
  }

  onData() {
    console.log("onData");
  }
}

//export function request(serverUrl, data) {
//  let ts = Math.floor(Date.now() / 1000);
//
//  return qrCode.create(new Uint8Array(16), ts, serverUrl);
//}
