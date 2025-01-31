import { wiWallet } from "./wiWallet.js";
import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import {CarmentisError} from "../../common/errors/error.js";

export class wiApplicationWallet extends wiWallet {
  constructor(privateKey) {
    super(privateKey);
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
  static extractDataFromQrCode(qrData) {
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
  async obtainDataFromServer(serverUrl, qrId) {
    let _this = this;

    return new Promise(function (resolve, reject) {
      console.log("[wallet] opening socket with", serverUrl);
      _this.socket = clientSocket.getSocket(serverUrl, onConnect.bind(_this), onData.bind(_this));

      function onConnect() {
        console.log("[wallet] connected");
        _this.socket.sendMessage(SCHEMAS.WIMSG_CONNECTION_ACCEPTED, { qrId: qrId });
      }

      async function onData(id, object) {
        console.log("[wallet] incoming data", id, object);

        switch(id) {
          case SCHEMAS.WIMSG_FORWARDED_REQUEST: {
            let req = this.decodeRequest(object);

            resolve(req);
            break;
          }
        }
      }
    });
  }

  /**
   * Processes and approves an execution request based on its type. Specifically handles requests related to authentication by public key.
   *
   * @param {Object} req - The request object containing the type and necessary data for execution.
   * @param {number} req.type - The type of the request to process.
   * @param {Object} req.object - The additional data required to process the request, such as a challenge for public key authentication.
   * @param {Object} req.object.challenge - The challenge
   * @return {void} Does not return any value but may send a message or log a warning based on the request type.
   */
  approveRequestExecution(req) {
    let res = this.processRequest(req);

    this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, res);
  }

  /**
   * Approves an authentication request by generating a response using a private key and challenge.
   *
   * @param {string} serverUrl - The server.
   * @param {string} challenge - The challenge provided for the authentication process.
   * @return {Promise<void>} Resolves when the authentication approval process is completed.
   */
  async approveAuthenticationRequest(serverUrl, challenge) {
    let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY], {
      publicKey: crypto.secp256k1.publicKeyFromPrivateKey(this.privateKey),
      signature: crypto.secp256k1.sign(this.privateKey, challenge)
    });


    this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, answer: answer });
    /*
    return new Promise(function (resolve, reject) {
      console.log("[wallet] opening socket with", serverUrl);
      const socket = clientSocket.getSocket(serverUrl, onConnect.bind(this), undefined);

      function onConnect() {
        console.log("[wallet] connected");
        socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, answer: answer });
      }
    });*/
  }
}
