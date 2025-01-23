import { sha256, pbkdf2Async, hkdf } from "./noble/hashes.js";
import * as uint8 from "../util/uint8.js";

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
