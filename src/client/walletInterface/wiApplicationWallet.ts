import { wiWallet } from "./wiWallet";
import { SCHEMAS } from "../../common/constants/constants";
import * as crypto from "../../common/crypto/crypto";
//import * as schemaSerializer from "../../common/serializers/schema-serializer";
import * as clientSocket from "./wiClientSocket";
import * as qrCode from "../qrCode/qrCode";
import {SchemaSerializer} from "../../common/data/schemaSerializer";
//import {CarmentisError} from "../../common/errors/error";

export class wiApplicationWallet extends wiWallet<Uint8Array> {
  socket: any;
  constructor() {
    super();
  }

  /**
   * Decodes the given QR code data and extracts relevant information.
   *
   * @param {string} qrData - The raw QR code data to be decoded and processed.
   * @return {{
   *     qrId: Uint8Array,
   *     serverUrl: string,
   *     timestamp: number,
   * }} Returns an object containing the extracted data.
   */
  static extractDataFromQrCode(qrData: any) {
    const data = qrCode.decode(qrData);
    data.serverUrl = data.serverUrl.trim();
    return data;
  }

  /**
   * Establishes a connection to a server via a socket and processes incoming data.
   *
   * @param {Uint8Array} qrId - The unique identifier for the connection, typically represented as a QR code ID.
   * @param {string} serverUrl - The URL of the server to connect to.
   * @return {Promise<{type: number, object: any}>} A promise that resolves with the processed request object. The resolved object contains the `type` of the request and the decoded `object` associated with it.
   */
  async obtainDataFromServer(serverUrl: any, qrId: any) {
    let _this = this;

    return new Promise(function (resolve, reject) {
      console.log("[wallet] opening socket with", serverUrl);
      _this.socket = clientSocket.getSocket(serverUrl, onConnect.bind(_this), onData.bind(_this));

      function onConnect() {
        console.log("[wallet] connected");
        _this.socket.sendMessage(SCHEMAS.WIMSG_CONNECTION_ACCEPTED, { qrId: qrId });
      }

      async function onData(this: any, id: any, object: any) {
        console.log("[wallet] incoming data", id, object);

        switch(id) {
          case SCHEMAS.WIMSG_FORWARDED_REQUEST: {
            let req = this.decodeRequest(object.requestType, object.request);

            resolve(req);
            break;
          }
        }
      }
    });
  }

  /**
   * Formats an answer, using the application wallet format.
   */
  formatAnswer(answerType: number, object: any) {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const schemaSerializer = new SchemaSerializer(SCHEMAS.WI_ANSWERS[answerType]);
    let answer = schemaSerializer.serialize(object);

    return {
      answerType: answerType,
      answer: answer
    };
  }

  sendAnswer(answer: any) {
    this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, answer);
  }
}
