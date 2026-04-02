import {qrcode} from "./qrCodeGenerator";
import {QRCode} from "./types";
import {EncoderFactory} from "../../common/utils/encoder";
import {
  WI_MAX_SERVER_URL_LENGTH
} from "../../common/type/valibot/clientBridge/clientBridgeMessages";
import {WiQrCodeEncoder} from "../../common/type/valibot/clientBridge/WiQrCodeEncoder";

// ============================================================================================================================ //
//  create()                                                                                                                    //
// ============================================================================================================================ //
/**
 * Generates a QR code with the given parameters and returns an object containing the QR image tag and data.
 *
 * @param {string} qrId - The unique identifier for the QR code.
 * @param {number} timestamp - The timestamp indicating when the QR code was created.
 * @param {string} serverUrl - The server URL to be included in the QR code data.
 * @return {Object} An object containing the `imageTag` (QR code image as a string) and `data` (QR code data string).
 */
export function create(qrId: string, timestamp: number, serverUrl: string) {
  const data = WiQrCodeEncoder.encode({
    base64EncodedQrId: qrId,
    timestamp: timestamp,
    serverUrl: serverUrl.padEnd(WI_MAX_SERVER_URL_LENGTH)
  })

  const base64Encoder = EncoderFactory.bytesToBase64Encoder();
  const qr = qrcode(0, "L") as QRCode;
  const b64 = base64Encoder.encode(data);
  const qrData = `carmentis:${b64}`;

  qr.addData(qrData, "Byte");
  qr.make();

  const qrImgTag = qr.createImgTag(4, 0);

  return {
    imageTag: qrImgTag,
    data: qrData
  };
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
/**
 * Decodes a QR code string into an object using a specific schema.
 *
 * @param {string} qrData - The QR code data string to decode.
 * @return {Object|boolean} Returns the decoded object if successful, or `false` if decoding fails.
 */
export function decode(qrData: any) {
  let match = qrData.match(/^carmentis:([\w-]+)$/);

  if(match) {
    try {
      const base64Encoder = EncoderFactory.bytesToBase64Encoder();
      let data = base64Encoder.decode(match[1]);

      /*
      let obj = schemaSerializer.decode(
        SCHEMAS.WI_QR_CODE,
        data
      );

       */
      const obj = WiQrCodeEncoder.decode(data);
      return obj;
    } catch(e) {
      throw e
    }
  }
  throw new Error("Invalid QR code data");
}
