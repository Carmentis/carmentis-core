import { ERRORS, SCHEMAS } from "../../common/constants/constants";
import * as crypto from "../../common/crypto/crypto";
import * as clientSocket from "./wiClientSocket";
import * as qrCode from "../qrCode/qrCode";
import * as web from "../web/web";
import {SchemaSerializer, SchemaUnserializer} from "../../common/data/schemaSerializer";
import {randomBytes} from "@noble/post-quantum/utils";
import {bytesToHex, hexToBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "../../common/crypto/CryptoSchemeFactory";
import {StringSignatureEncoder} from "../../common/crypto/signature/signature-encoder";
import {WI_INVALID_SIGNATURE} from "../../common/constants/errors";
import {EncoderFactory, EncoderInterface} from "../../common/utils/encoder";
//import { wiError } from "../../common/errors/error";

export class wiClient {
  button: any;
  buttonAttached: any;
  buttonCallback: any;
  eventOfButtonAttached: any;
  qrElement: any;
  serverUrl: any;
  private messageCallback: any;
  private encoder: EncoderInterface<Uint8Array, string>;
  constructor() {
    window.addEventListener(
      "message",
      event => this.messageCallback && this.messageCallback(event),
      false
    );
    this.encoder = EncoderFactory.defaultBytesToStringEncoder();
  }

  /**
   * Attaches a QR code container element by its ID.
   *
   * @param {string} id - The ID of the HTML element to be used as the QR code container.
   * @return {void} This method does not return a value.
   */
  attachQrCodeContainer(id: any) {
    this.qrElement = web.get("#" + id);

    if(!this.qrElement) {
      throw `Container '${id}' not found`;
    }
  }

  attachQrCodeElement(element: any) {
    this.qrElement = element
  }

  attachExtensionButtonElement(element: any) {
    if(this.buttonAttached) {
      throw `Extension button already attached`;
    }
    this.button = element
    this.eventOfButtonAttached = this.button.addEventListener(
        "click",
        (_: any) => this.buttonCallback && this.buttonCallback()
    );
    this.buttonAttached = true;
  }

  attachExtensionButton(id: any) {
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
      (_: any) => this.buttonCallback && this.buttonCallback()
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

  getQrData(id: any) {
    return web.get("#" + id).getAttribute("qrData");
  }

  setServerUrl(url: any) {
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
  async authenticationByPublicKey(challengeString: any) {
    let challenge;

    if(challengeString == undefined) {
      challenge = randomBytes(32);
      challengeString = bytesToHex(challenge);
    }
    else {
      challenge = hexToBytes(challengeString);
    }

    console.log("[wiClient] performing the authentication request...")

    let answer = await this.request<{publicKey: string, signature: string}>(
      SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
      {
        challenge: challenge
      }
    );




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
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      email: answer.email,
    };
  }

  /**
   * Retrieves user data based on the provided required data.
   *
   * @param {Object} requiredData - The data required to request user information.
   * @return {Promise<Object>} A promise that resolves to an object containing the user's email.
   */
  async getUserData(requiredData: any) {
    let answer = await this.request(
      SCHEMAS.WIRQ_GET_USER_DATA,
      {
        requiredData
      }
    );

    console.log("[wiClient] Obtained response:", answer)

    return {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
      userData: answer.userData
    };
  }


  /**
   * Data approval process.
   *
   * @param {string} anchorRequestId - The data identifier returned by the operator server.
   *
   * @return {Promise<{vbHash: string, mbHash: string, height: number}>} The hash of the block and chain where the block of the event is located.
   * @throws {Error} If the process fails.
   */
  async getApprovalData(anchorRequestId: string) {
    const encoder = EncoderFactory.defaultBytesToStringEncoder();
    let answer = await this.request<{vbHash: Uint8Array, mbHash: Uint8Array, height: number}>(
      SCHEMAS.WIRQ_DATA_APPROVAL,
      {
        anchorRequestId: encoder.decode(anchorRequestId),
        serverUrl: this.serverUrl
      }
    );

    return answer;
  }

  async request<T = unknown>(type: any, object: any): Promise<T> {
    console.log("[client] request", type, object);

    const schemaSerializer = new SchemaSerializer(SCHEMAS.WI_REQUESTS[type]);
    let request = schemaSerializer.serialize(object);

    let reqObject = {
      requestType: type,
      request    : request,
      deviceId   : new Uint8Array(32),
      withToken  : 0
    };

    let _this = this;

    return new Promise(function(resolve, reject) {
      console.log("[client] opening socket with", _this.serverUrl);
      // @ts-expect-error TS(2339): Property 'socket' does not exist on type 'wiClient... Remove this comment to see the full error message
      _this.socket = clientSocket.getSocket(_this.serverUrl, onConnect.bind(_this), onData.bind(_this));

      // @ts-expect-error TS(2339): Property 'socket' does not exist on type 'wiClient... Remove this comment to see the full error message
      _this.socket.sendMessage(SCHEMAS.WIMSG_REQUEST, reqObject);
      _this.buttonCallback = sendRequestToExtension;

      function sendRequestToExtension() {
        // @ts-expect-error TS(2339): Property 'carmentisWallet' does not exist on type ... Remove this comment to see the full error message
        if(window.carmentisWallet == undefined) {
          console.warn("The Carmentis extension is not installed.");
          return;
        }

        // @ts-expect-error TS(2339): Property 'socket' does not exist on type 'wiClient... Remove this comment to see the full error message
        _this.socket.disconnect();

        _this.messageCallback = (event: any) => {
          console.log("[wiClient] received answer:", event);

          if(event.data.from == "carmentis/walletResponse") {

            let object = event.data.data,
                schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]),
                //binary = base64.decodeBinary(object.answer, base64.BASE64),
                binary = _this.encoder.decode(object.answer),
                answerObject = schemaSerializer.unserialize(binary);

            resolve(answerObject as T);
          }
        };

        let message = {
          requestType: type,
          request: _this.encoder.encode(request)
          //request: base64.encodeBinary(request, base64.BASE64)
        };

        // @ts-expect-error TS(2339): Property 'carmentisWallet' does not exist on type ... Remove this comment to see the full error message
        window.carmentisWallet.openPopup(message);
      }

      function onConnect() {
        console.log("[client] connected");
      }

      function onData(id: any, object: any) {
        console.log("[client] incoming data", id, object);

        switch(id) {
          case SCHEMAS.WIMSG_UPDATE_QR: {
            let qr = qrCode.create(object.qrId, object.timestamp, _this.serverUrl);

            _this.qrElement.setAttribute("qrData", qr.data);
            if ('html' in _this.qrElement) _this.qrElement.html(qr.imageTag);
            if ('innerHTML' in _this.qrElement ) _this.qrElement.innerHTML(qr.imageTag);
            break;
          }

          case SCHEMAS.WIMSG_FORWARDED_ANSWER: {
            const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]);
            let answerObject = schemaSerializer.unserialize(object.answer);

            resolve(answerObject as T);
            break;
          }
        }
      }
    });
  }
}
