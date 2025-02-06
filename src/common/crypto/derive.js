import { sha256, pbkdf2Async, hkdf } from "./noble/hashes.js";
import * as uint8 from "../util/uint8.js";

export const PREFIX_SUBSECTION_KEY = 0x01;
export const PREFIX_SUBSECTION_IV  = 0x02;
export const PREFIX_ACTOR_KEY      = 0x03;
export const PREFIX_CHANNEL_KEY    = 0x04;

// ============================================================================================================================ //
//  deriveBitsPbkdf2()                                                                                                          //
// ============================================================================================================================ //
export async function deriveBitsPbkdf2(arr, salt, bits, iterations) {
  return await pbkdf2Async(
    sha256,
    arr,
    salt,
    {
      c: iterations,
      dkLen: bits / 8
    }
  );
}

// ============================================================================================================================ //
//  deriveBitsFromKey()                                                                                                         //
// ============================================================================================================================ //
export function deriveBitsFromKey(key, info, bits) {
  return deriveBitsHkdf(uint8.fromHexa(key), new Uint8Array(), info, bits);
}

// ============================================================================================================================ //
//  deriveBitsHkdf()                                                                                                            //
// ============================================================================================================================ //
export function deriveBitsHkdf(arr, salt, info, bits) {
  return hkdf(
    sha256,
    arr,
    salt,
    info,
    bits / 8
  );
}
