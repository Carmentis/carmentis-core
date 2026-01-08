import {wiWallet} from "./wiWallet";
import {SchemaSerializer} from "../../common/data/schemaSerializer";
import {EncoderFactory, EncoderInterface} from "../../common/utils/encoder";

export class wiExtensionWallet extends wiWallet<string> {
  private encoder: EncoderInterface<Uint8Array, string>;
  constructor() {
    super();
    this.encoder = EncoderFactory.defaultBytesToStringEncoder();
  }
/*
  getRequestFromMessage(messageData: any) {
    let request = this.encoder.decode(messageData.request),
        requestObject = this.decodeRequest(messageData.requestType, request);

    return requestObject;
  }

 */

  /**
   * Formats an answer, using the extension wallet format.
   */
  formatAnswer(answerType: number, object: any) {
    throw new Error("Method not implemented.");
    /*
    const schemaSerializer = new SchemaSerializer(WI_ANSWERS[answerType])
    let answer = schemaSerializer.serialize(object);

    return {
      answerType: answerType,
      answer: this.encoder.encode(answer)
    };

     */
  }
}
