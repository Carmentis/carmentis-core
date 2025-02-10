import { ERRORS, SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as base64 from "../../common/util/base64.js";
import * as uint8 from "../../common/util/uint8.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import * as web from "../web/web.js";
import { wiError } from "../../common/errors/error.js";

export class wiClient {
  constructor() {
  }

  /**
   * Attaches a QR code container element by its ID.
   *
   * @param {string} id - The ID of the HTML element to be used as the QR code container.
   * @return {void} This method does not return a value.
   */
  attachQrCodeContainer(id) {
    this.qrElement = web.get("#" + id);

    if(!this.qrElement) {
      throw `Container '${id}' not found`;
    }
  }

  attachExtensionButton(id) {
    this.buttonElement = web.get("#" + id);

    if(!this.buttonElement) {
      throw `Button '${id}' not found`;
    }
  }

  getQrData(id) {
    return web.get("#" + id).getAttribute("qrData");
  }

  setServerUrl(url) {
    this.serverUrl = url;
  }

  /**
   * Authenticates using a public key based mechanism by verifying the digital signature of a challenge.
   *
   * @param {string} challengeString - An optional hexadecimal string representing the challenge.
   *                                    If not provided, a random challenge will be generated.
   * @return {Promise<{
   *     challenge: string,
   *     signature: string,
   *     publicKey: string,
   * }>} A promise that resolves to an object containing:
   *                           - challenge: The hexadecimal representation of the challenge.
   *                           - publicKey: The public key used in the authentication process.
   *                           - signature: The digital signature verifying the challenge.
   * @throws {Error} If the public key signature verification fails.
   */
  async authenticationByPublicKey(challengeString) {
    let challenge;

    if(challengeString == undefined) {
      challenge = crypto.getRandomBytes(32);
      challengeString = uint8.toHexa(challenge);
    }
    else {
      challenge = uint8.fromHexa(challengeString);
    }

    console.log("[wiClient] performing the authentication request...")
    let answer = await this.request(SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, { challenge: challenge });

    if(!crypto.secp256k1.verify(answer.publicKey, challenge, answer.signature)) {
      throw new wiError(ERRORS.WI_INVALID_SIGNATURE);
    }

    console.log("[wiClient] Obtained response:", answer)
    return {
      challenge: challengeString,
      publicKey: answer.publicKey,
      signature: answer.signature
    };
  }


  /**
   * Retrieves the email information by sending a request using a predefined schema.
   *
   * @return {Promise<{email: string}>} A promise that resolves to an object containing the email address.
   */
  async getEmail() {
    let answer = await this.request(SCHEMAS.WIRQ_GET_EMAIL, {});

    console.log("[wiClient] Obtained response:", answer)
    return {
      email: answer.email,
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

      _this.buttonElement.el.addEventListener("click", sendRequestToExtension);

      function sendRequestToExtension() {
        if(window.carmentisWallet == undefined) {
          console.warn("The Carmentis extension is not installed.");
          return;
        }

        _this.socket.disconnect();

        window.addEventListener(
          "message",
          (event) => {
            console.log('[wiClient] received answer:', event);
            if(event.data.from == "carmentis/walletResponse") {
              let object = event.data.data,
                  binary = base64.decodeBinary(object.answer, base64.BASE64),
                  answerObject = schemaSerializer.decode(SCHEMAS.WI_ANSWERS[object.answerType], binary);

              resolve(answerObject);
            }
          },
          false
        );

        let message = {
          requestType: type,
          request: base64.encodeBinary(request, base64.BASE64)
        };

        window.carmentisWallet.openPopup(message);
      }

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
