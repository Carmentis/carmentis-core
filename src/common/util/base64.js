import * as encoder from "./textEncoder.js";

const ALPHA = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export const BASE64 = ALPHA + "+/=";
export const URL    = ALPHA + "-_=";

// ============================================================================================================================ //
//  encodeString()                                                                                                              //
// ============================================================================================================================ //
export function encodeString(str, alphabet, padding) {
  return encodeBinary(encoder.encode(str), alphabet, padding);
}

// ============================================================================================================================ //
//  encodeBinary()                                                                                                              //
// ============================================================================================================================ //
export function encodeBinary(bin, alphabet, padding) {
  let r = bin.length % 3,
      acc = 0,
      out = "";

  for(let i = 0; i < bin.length || i % 3;) {
    acc = acc << 8 | bin[i++];

    if(!(i % 3)) {
      for(let j = 4; j--;) {
        out += alphabet[acc >> j * 6 & 0x3F];
      }
      acc = 0;
    }
  }
  return r ? out.slice(0, r - 3) + alphabet[0x40].repeat(padding ? 3 - r : 0) : out;
}

// ============================================================================================================================ //
//  decodeString()                                                                                                              //
// ============================================================================================================================ //
export function decodeString(str, alphabet) {
  return encoder.decode(decodeBinary(str, alphabet));
}

// ============================================================================================================================ //
//  decodeBinary()                                                                                                              //
// ============================================================================================================================ //
export function decodeBinary(str, alphabet) {
  let crop = 0,
      acc = 0,
      out = [];

  str += alphabet[0x40].repeat(-str.length & 3);

  for(let i = 0; i < str.length;) {
    let n = alphabet.indexOf(str[i++]);

    crop += n == 0x40;
    acc = acc << 6 | n;

    if(!(i & 3)) {
      out.push(acc >> 16 & 0xFF, acc >> 8 & 0xFF, acc & 0xFF);
    }
  }
  return new Uint8Array(crop ? out.slice(0, -crop) : out);
}
