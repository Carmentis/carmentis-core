import { ERRORS, SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
//import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
//import * as base64 from "../../common/util/base64.js";
//import * as uint8 from "../../common/util/uint8.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import * as web from "../web/web.js";
import {SchemaSerializer, SchemaUnserializer} from "../../common/data/schemaSerializer.js";
import {randomBytes} from "@noble/post-quantum/utils";
import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {Base64 as base64} from "../../common/data/base64.js";
import {CryptoSchemeFactory} from "../../common/crypto/factory.js";
import {SignatureAlgorithmId} from "../../common/crypto/signature-interface.js";
//import { wiError } from "../../common/errors/error.js";

export class wiClient {
  constructor() {
    window.addEventListener(
      "message",
      event => this.messageCallback && this.messageCallback(event),
      false
    );
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
    if(this.buttonAttached) {
      throw `Extension button already attached`;
    }

    let buttonElement = web.get("#" + id);

    if(!buttonElement) {
      throw `Button '${id}' not found`;
    }
    this.button = buttonElement.el;
    this.eventOfButtonAttached = this.button.addEventListener(
      "click",
      _ => this.buttonCallback && this.buttonCallback()
    );

    this.buttonAttached = true;
  }

  /**
   * Detaches the previously attached click event listener from the extension button.
   * Ensures that the event listener is removed and the associated reference is cleared.
   *
   * @return {void} Does not return any value.
   */
  detach() {
    if (this.eventOfButtonAttached) {
      this.buttonAttached = false;
      this.button.removeEventListener("click", this.eventOfButtonAttached);
      this.eventOfButtonAttached = undefined;
      this.button = undefined;
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
      challenge = randomBytes(32);
      challengeString = bytesToHex(challenge);
    }
    else {
      challenge = hexToBytes(challengeString);
    }

    console.log("[wiClient] performing the authentication request...")

    let answer = await this.request(
      SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
      {
        challenge: challenge
      }
    );

    // load the public key
    const cryptoFactory = new CryptoSchemeFactory();

    const publicKey = cryptoFactory.createPublicSignatureKey(SignatureAlgorithmId.ML_DSA_65, answer.publicKey) // TODO add dynamic key parsing
    if (!publicKey.verify(challenge, answer.signature)) {
      throw new Error(ERRORS.WI_INVALID_SIGNATURE);
    }

    /*
    if(!crypto.secp256k1.verify(answer.publicKey, challenge, answer.signature)) {
      throw new Error(ERRORS.WI_INVALID_SIGNATURE);
    }
     */

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
    let answer = await this.request(
      SCHEMAS.WIRQ_GET_EMAIL,
      {}
    );

    console.log("[wiClient] Obtained response:", answer)

    return {
      email: answer.email,
    };
  }

  /**
   * Retrieves user data based on the provided required data.
   *
   * @param {Object} requiredData - The data required to request user information.
   * @return {Promise<Object>} A promise that resolves to an object containing the user's email.
   */
  async getUserData(requiredData) {
    let answer = await this.request(
      SCHEMAS.WIRQ_GET_USER_DATA,
      {
        requiredData
      }
    );

    console.log("[wiClient] Obtained response:", answer)

    return {
      userData: answer.userData
    };
  }


  /**
   * Data approval process.
   *
   * @param {string} dataId - The data identifier returned by the operator server.
   *
   * @return {Promise<{vbHash: string, mbHash: string, height: number}>} The hash of the block and chain where the block of the event is located.
   * @throws {Error} If the process fails.
   */
  async getApprovalData(dataId) {
    let answer = await this.request(
      SCHEMAS.WIRQ_DATA_APPROVAL,
      {
        dataId: dataId,
        serverUrl: this.serverUrl
      }
    );

    return answer;
  }

  async request(type, object) {
    console.log("[client] request", type, object);
    const schemaSerializer = new SchemaSerializer(SCHEMAS.WI_REQUESTS[type]);
    let request = schemaSerializer.serialize(object);

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
      _this.buttonCallback = sendRequestToExtension;

      function sendRequestToExtension() {
        if(window.carmentisWallet == undefined) {
          console.warn("The Carmentis extension is not installed.");
          return;
        }

        _this.socket.disconnect();

        _this.messageCallback = event => {
          console.log("[wiClient] received answer:", event);

          if(event.data.from == "carmentis/walletResponse") {
            let object = event.data.data,
                schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]),
                binary = base64.decodeBinary(object.answer, base64.BASE64),
                answerObject = schemaSerializer.unserializeObject(binary);

            resolve(answerObject);
          }
        };

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
            const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]);
            let answerObject = schemaSerializer.unserialize(object.answer);

            resolve(answerObject);
            break;
          }
        }
      }
    });
  }
}
