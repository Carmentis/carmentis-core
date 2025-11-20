import {wiWallet} from "./wiWallet";
import {SchemaSerializer} from "../../common/data/schemaSerializer";
import {WI_ANSWERS} from "../../common/constants/schemas";
import {EncoderFactory, EncoderInterface} from "../../common/utils/encoder";

export class wiExtensionWallet extends wiWallet<string> {
  private encoder: EncoderInterface<Uint8Array, string>;
  constructor() {
    super();
    this.encoder = EncoderFactory.defaultBytesToStringEncoder();
  }

  /**
   * Decodes the request data from the provided message and returns the request object.
   *
   * @param {Object} messageData - The message data containing the request and request type.
   * @param {string} messageData.request - The encoded request in base64 format.
   * @param {number} messageData.requestType - The type of the request to be decoded.
   * @return {{type:number}} The decoded request object.
   */
  getRequestFromMessage(messageData: any) {
    let request = this.encoder.decode(messageData.request),
        requestObject = this.decodeRequest(messageData.requestType, request);

    return requestObject;
  }

  /**
   * Formats an answer, using the extension wallet format.
   */
  formatAnswer(answerType: number, object: any) {
    // @ts-ignore
    const schemaSerializer = new SchemaSerializer(WI_ANSWERS[answerType])
    let answer = schemaSerializer.serialize(object);

    return {
      answerType: answerType,
      answer: this.encoder.encode(answer)
    };
  }
}
