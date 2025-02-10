import { sha256, hmac } from "./noble/hashes.js";
import * as secp256k1 from "./noble/secp256k1.js";
import * as uint8 from "../util/uint8.js";
import { cryptoErrorHandler } from "../errors/error.js";

secp256k1.etc.hmacSha256Sync = (k, ...m) => hmac(sha256, k, secp256k1.etc.concatBytes(...m));

// ============================================================================================================================ //
//  publicKeyFromPrivateKey()                                                                                                   //
// ============================================================================================================================ //
export function publicKeyFromPrivateKey(privateKey) {
  try {
    return uint8.toHexa(secp256k1.getPublicKey(uint8.fromHexa(privateKey)));
  }
  catch(e) {
    cryptoErrorHandler(e);
  }
}

// ============================================================================================================================ //
//  sign()                                                                                                                      //
// ============================================================================================================================ //
export function sign(privateKey, data) {
  try {
    let hash = sha256(data),
        signature = secp256k1.sign(hash, uint8.fromHexa(privateKey));

    return uint8.toHexa(signature.toCompactRawBytes());
  }
  catch(e) {
    cryptoErrorHandler(e);
  }
}

// ============================================================================================================================ //
//  verify()                                                                                                                    //
// ============================================================================================================================ //
/**
 * Verifies a digital signature using the secp256k1 algorithm.
 *
 * @param {string} publicKey - The public key in hexadecimal format used for verification.
 * @param {Uint8Array} data - The original data to be verified.
 * @param {string} signature - The digital signature in hexadecimal format to verify.
 * @return {boolean} Returns true if the signature is valid, false otherwise.
 */
export function verify(publicKey, data, signature) {
  try {
    let hash = sha256(data);

    return secp256k1.verify(uint8.fromHexa(signature), hash, uint8.fromHexa(publicKey));
  }
  catch(e) {
    cryptoErrorHandler(e);
  }
}
