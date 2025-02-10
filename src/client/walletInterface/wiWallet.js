import { SCHEMAS } from "../../common/constants/constants.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as clientSocket from "./wiClientSocket.js";
import * as qrCode from "../qrCode/qrCode.js";
import {CarmentisError} from "../../common/errors/error.js";

export class wiWallet {
  constructor(privateKey) {
    if (privateKey) {
      this.privateKey = privateKey;
      this.publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey);
    }
  }

  decodeRequest(requestType, request) {
    let requestObject = schemaSerializer.decode(SCHEMAS.WI_REQUESTS[requestType], request);

    let req = {
      type: requestType,
      object: requestObject
    };

    return req;
  }

  processRequest(req) {
    switch(req.type) {
      case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
        let signature = crypto.secp256k1.sign(this.privateKey, req.object.challenge);

        let answerObject = {
          publicKey: this.publicKey,
          signature: signature
        };

        let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY], answerObject);

        return {
          answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
          answer: answer
        }
      }
      default: {
        throw `Unknown request type: ${req.type}`;
        break;
      }
    }
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
  approveRequestExecution( req) {
    switch(req.type) {
      case SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY: {
        let signature = crypto.secp256k1.sign(this.privateKey, req.object.challenge);

        let answerObject = {
          publicKey: this.publicKey,
          signature: signature
        };

        let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY], answerObject);

        this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, answer: answer });
        break;
      }
      default: {
        console.warn(`Unknown request type: ${req.type}`)
        break;
      }
    }
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
  }


  /**
   * Approves a request to get an email by encoding it with the defined schema
   * and sending the encoded message through the socket.
   *
   * @param {string} email - The email address to be approved and processed.
   * @return {Promise<void>} A promise that resolves when the message is successfully sent through the socket.
   */
  async approveGetEmailRequest(email) {
    let answer = schemaSerializer.encode(SCHEMAS.WI_ANSWERS[SCHEMAS.WIRQ_GET_EMAIL], {
      email: email
    });


    this.socket.sendMessage(SCHEMAS.WIMSG_ANSWER, { answerType: SCHEMAS.WIRQ_GET_EMAIL, answer: answer });
  }
}
