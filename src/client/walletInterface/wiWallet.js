import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";

export class wiWallet {
  constructor() {
  }

  processQrCode(qrData) {
    let data = qrCode.decode(qrData);

    console.log("[wallet] opening socket");
    this.socket = clientSocket.getSocket(data.serverUrl, onConnect.bind(this), onData.bind(this));

    function onConnect() {
      console.log("[wallet] connected");
    }

    function onData(id, object) {
      console.log("[wallet] incoming data", id, object);
    }
  }
}
