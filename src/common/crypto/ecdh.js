import { sha256 } from "@noble/hashes/sha256";
import * as secp256k1 from "@noble/secp256k1";
import * as uint8 from "../util/uint8.js";
import { cryptoErrorHandler } from "../errors/error.js";

// ============================================================================================================================ //
//  getSharedKey()                                                                                                              //
// ============================================================================================================================ //
export function getSharedKey(myPrivateKey, theirPublicKey) {
  try {
    let keyMaterial = secp256k1.getSharedSecret(myPrivateKey, theirPublicKey),
        key = sha256(keyMaterial);

    return uint8.toHexa(key);
  }
  catch(e) {
    cryptoErrorHandler(e);
  }
}
