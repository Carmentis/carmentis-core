import { ml_dsa65 } from "@noble/post-quantum/ml-dsa";
import { randomBytes } from "@noble/post-quantum/utils";
import { cryptoErrorHandler } from "../errors/error.js";

// ============================================================================================================================ //
//  generateKeyPair()                                                                                                           //
// ============================================================================================================================ //
export function generateKeyPair(seed) {
  if(seed == undefined) {
    seed = randomBytes(32);
  }

  const keys = ml_dsa65.keygen(seed);

  return keys;
}

// ============================================================================================================================ //
//  sign()                                                                                                                      //
// ============================================================================================================================ //
export function sign(privateKey, msg) {
  return ml_dsa65.sign(privateKey, msg);
}

// ============================================================================================================================ //
//  verify()                                                                                                                    //
// ============================================================================================================================ //
export function verify(publicKey, msg, signature) {
  return ml_dsa65.verify(publicKey, msg, signature);
}
