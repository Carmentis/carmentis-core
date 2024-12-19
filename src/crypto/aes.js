import { randomBytes, gcm, ctr } from "./noble/ciphers.js";
import * as uint8 from "../util/uint8.js";

// ============================================================================================================================ //
//  nonceToIv()                                                                                                                 //
// ============================================================================================================================ //
export function nonceToIv(nonce) {
  let iv = new Uint8Array(16);

  if(typeof nonce == "number") {
    iv[7] = nonce;
  }
  else if(nonce instanceof Uint8Array && nonce.length == 8) {
    iv.set(nonce, 0);
  }
  else {
    throw "invalid nonce";
  }

  return iv;
}

// ============================================================================================================================ //
//  incrementNonce()                                                                                                            //
// ============================================================================================================================ //
export function incrementNonce(nonce) {
  let carry = 1;

  for(let n = 8; carry && n--;) {
    nonce[n] += carry;
    carry = !nonce[n];
  }
}

// ============================================================================================================================ //
//  encryptCtr()                                                                                                                //
// ============================================================================================================================ //
export function encryptCtr(key, data, counter) {
  const stream = ctr(uint8.fromHexa(key), counter);
  const encrypted = stream.encrypt(data);

  return encrypted;
}

// ============================================================================================================================ //
//  decryptCtr()                                                                                                                //
// ============================================================================================================================ //
export function decryptCtr(key, data, counter) {
  try {
    const stream = ctr(uint8.fromHexa(key), counter);
    const decrypted = stream.decrypt(data);

    return decrypted;
  }
  catch(e) {
    console.error(e);
  }
  return false;
}

// ============================================================================================================================ //
//  encryptGcm()                                                                                                                //
// ============================================================================================================================ //
export function encryptGcm(key, data, iv) {
  const stream = gcm(uint8.fromHexa(key), iv);
  const encrypted = stream.encrypt(data);

  return encrypted;
}

// ============================================================================================================================ //
//  decryptGcm()                                                                                                                //
// ============================================================================================================================ //
export function decryptGcm(key, data, iv) {
  try {
    const stream = gcm(uint8.fromHexa(key), iv);
    const decrypted = stream.decrypt(data);

    return decrypted;
  }
  catch(e) {
    console.error(e);
  }
  return false;
}
