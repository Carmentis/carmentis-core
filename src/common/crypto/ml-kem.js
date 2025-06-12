import { ml_kem768 } from "@noble/post-quantum/ml-kem";
import { randomBytes } from "@noble/post-quantum/utils";
import { cryptoErrorHandler } from "../errors/error.js";

// ============================================================================================================================ //
//  generateKeyPair()                                                                                                           //
// ============================================================================================================================ //
export function generateKeyPair(seed) {
  if(seed == undefined) {
    seed = randomBytes(64);
  }

  const keys = ml_kem768.keygen(seed);

  return keys;
}

// ============================================================================================================================ //
//  encapsulate()                                                                                                               //
// ============================================================================================================================ //
export function encapsulate(publicKey) {
  return ml_kem768.encapsulate(publicKey);
}

// ============================================================================================================================ //
//  decapsulate()                                                                                                               //
// ============================================================================================================================ //
export function decapsulate(cipherText, privateKey) {
  return ml_kem768.decapsulate(cipherText, privateKey);
}
