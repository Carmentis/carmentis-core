import { CURRENCY } from "../constants/constants.js";

// ============================================================================================================================ //
//  Currency format: CNNNNNNN NNNNNNNN                                                                                          //
//                                                                                                                              //
//    C: custom currency flag                                                                                                   //
//    N: if C = 0, ISO 4217 currency code with 5 bits per character (interpreted as uppercase letters)                          //
//       if C = 1, index in the custom currency lookup table                                                                    //
// ============================================================================================================================ //

// ============================================================================================================================ //
//  encode()                                                                                                                    //
// ============================================================================================================================ //
export function encode(str) {
  let custom = CURRENCY.CUSTOM[str];

  return (
    custom == undefined ?
      [...str].reduce((p, c) => p << 5 | c.charCodeAt(0) - 65, 0)
    :
      0x8000 | custom[0]
  );
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
export function decode(v) {
  return (
    v & 0x8000 ?
      Object.keys(CURRENCY.CUSTOM).find(key => CURRENCY.CUSTOM[0] == (v & 0x7FFF))
    :
      String.fromCharCode((v >> 10 & 0x1F) + 65, (v >> 5 & 0x1F) + 65, (v & 0x1F) + 65)
  );
}
