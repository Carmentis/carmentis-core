import { qrcode } from "./qrCodeGenerator.js";
import { SCHEMAS } from "../../common/constants/constants.js";
//import { schemaSerializer } from "../../common/serializers/serializers.js";
//import * as base64 from "../../common/util/base64.js";
//import * as uint8 from "../../common/util/uint8.js";

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
export function create(qrId, timestamp, serverUrl) {
  let data = schemaSerializer.encode(
    SCHEMAS.WI_QR_CODE,
    {
      qrId: qrId,
      timestamp: timestamp,
      serverUrl: serverUrl.padEnd(SCHEMAS.WI_MAX_SERVER_URL_LENGTH)
    }
  );

  let qr = qrcode(0, "L"),
      b64 = base64.encodeBinary(data, base64.URL),
      qrData = `carmentis:${b64}`;

  qr.addData(qrData, "Byte");
  qr.make();

  let qrImgTag = qr.createImgTag(4, 0);

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
export function decode(qrData) {
  let match = qrData.match(/^carmentis:([\w-]+)$/);

  if(match) {
    try {
      let data = base64.decodeBinary(match[1], base64.URL);

      let obj = schemaSerializer.decode(
        SCHEMAS.WI_QR_CODE,
        data
      );

      return obj;
    }
    catch(e) {
    }
  }
  return false;
}
