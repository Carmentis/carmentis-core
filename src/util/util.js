import * as base64 from "./base64.js";

// ============================================================================================================================ //
//  isHash()                                                                                                                    //
// ============================================================================================================================ //
export function isHash(str) {
  return typeof str == "string" && /^[\da-f]{64}$/i.test(str);
}

// ============================================================================================================================ //
//  hexa()                                                                                                                      //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Converts an integer to hexadecimal format, padding to the left with zeros to reach 'size' if specified.                     //
// ============================================================================================================================ //
export function hexa(n, size) {
  return n.toString(16).toUpperCase().padStart(size || 1, "0");
}

// ============================================================================================================================ //
//  intToByteArray()                                                                                                            //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Converts a positive integer to a list of bytes in big-endian order, forcing at least 'size' bytes if specified.             //
//  The integer size should not exceed 48 bits.                                                                                 //
// ============================================================================================================================ //
export function intToByteArray(n, size = 1) {
  let arr = [];

  while(n || size) {
    arr.push(n % 0x100);
    n = Math.floor(n / 0x100);
    size -= !!size;
  }
  return arr.reverse();
}

// ============================================================================================================================ //
//  formatNumber()                                                                                                              //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Options:                                                                                                                    //
//    dec: number of decimal places (default: all of them)                                                                      //
//    sep: thousands separator (default: space)                                                                                 //
// ============================================================================================================================ //
export function formatNumber(n, options = {}) {
  let s = (options.dec == undefined ? n.toString() : n.toFixed(options.dec)).split(".");
  return s[0].replace(/\d(?=(\d{3})+$)/g, "$&" + (options.sep || " ")) + (s[1] ? "." + s[1] : "");
}

// ============================================================================================================================ //
//  formatSize()                                                                                                                //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Converts a number to a size in bytes with one decimal place, using the most appropriate unit from "bytes" to "TB".          //
//  If 'shortFormat' is set, "bytes" is abbreviated to "B".                                                                     //
// ============================================================================================================================ //
export function formatSize(n, shortFormat = false) {
  const unit = [ shortFormat ? "B" : "bytes", "KB", "MB", "GB", "TB" ];

  let ndx = unit.findIndex((_, i) => n < 1024 ** (i + 1) / 2);
  return (ndx ? (n / 1024 ** ndx).toFixed(1) : n) + " " + unit[ndx];
}

// ============================================================================================================================ //
//  blockNumber()                                                                                                               //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Formats a block number.                                                                                                     //
// ============================================================================================================================ //
export function blockNumber(n) {
  return n.toString().padStart(9, "0");
}

// ============================================================================================================================ //
//  formatTime()                                                                                                                //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  YYYY: full year                                                                                                             //
//  YY  : last two digits of the year                                                                                           //
//  MM  : month                                                                                                                 //
//  DD  : day                                                                                                                   //
//  hh  : hours                                                                                                                 //
//  mm  : minutes                                                                                                               //
//  ss  : seconds                                                                                                               //
//  S..S: milliseconds                                                                                                          //
// ============================================================================================================================ //
export function formatTime(format, date = new Date()) {
  return (
    format
    .replace(/YYYY/, date.getFullYear())
    .replace(/YY/, (date.getFullYear() % 100).toString().padStart(2, "0"))
    .replace(/MM/, (date.getMonth() + 1).toString().padStart(2, "0"))
    .replace(/DD/, date.getDate().toString().padStart(2, "0"))
    .replace(/hh/, date.getHours().toString().padStart(2, "0"))
    .replace(/mm/, date.getMinutes().toString().padStart(2, "0"))
    .replace(/ss/, date.getSeconds().toString().padStart(2, "0"))
    .replace(/S+/, s => Math.round(date.getMilliseconds() / 10 ** (3 - s.length)).toString().padStart(s.length, "0"))
  );
}

// ============================================================================================================================ //
//  elapsedTime()                                                                                                               //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Formats the time elapsed since a given timestamp in milliseconds:                                                           //
//  - If the timestamp is more than 1 year old, returns the date as "DD/MM/YYYY".                                               //
//  - If the timestamp is more than 15 days old, returns the date as "DD/MM".                                                   //
//  - Otherwise, returns "X unit ago" using the most appropriate unit among "sec(s)", "min(s)", "hr(s)" and "day(s)".           //
// ============================================================================================================================ //
export function elapsedTime(ts) {
  const value = [ 60, 60 * 60, 60 * 60 * 24, 60 * 60 * 24 * 15, 60 * 60 * 24 * 365, Infinity ];
  const unit  = [ "sec", "min", "hr", "day" ];

  let sec = Math.max(Math.floor((Date.now() - ts) / 1000), 1);

  let i = value.findIndex(m => sec < m),
      n = i ? Math.floor(sec / value[i - 1]) : sec;

  return (
    i > 3 ?
      formatTime(i == 4 ? "DD/MM" : "DD/MM/YYYY", new Date(ts))
    :
      n + " " + plural(n, unit[i]) + " ago"
  );
}
// ============================================================================================================================ //
//  titleCase()                                                                                                                 //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Returns the input string with the first character in upper case and all other characters in lower case.                     //
// ============================================================================================================================ //
export function titleCase(str) {
  return str[0].toUpperCase() + str.slice(1).toLowerCase();
}

// ============================================================================================================================ //
//  plural()                                                                                                                    //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Takes a number n, a 'unit' string and an optional 'plural' form. Returns 'plural' or 'unit' + 's' if n > 1, or 'unit'       //
//  otherwise.                                                                                                                  //
// ============================================================================================================================ //
export function plural(n, unit, plural) {
  return n > 1 ? plural || unit + "s" : unit;
}

// ============================================================================================================================ //
//  passwordStrength()                                                                                                          //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Rough estimation of the strength of a password:                                                                             //
//    0 : too weak                                                                                                              //
//    1 : weak                                                                                                                  //
//    2 : medium                                                                                                                //
//    3 : strong                                                                                                                //
// ============================================================================================================================ //
export function passwordStrength(str) {
  const typeRegex = [ /[a-z]/, /[A-Z]/, /\d/, /./ ];
  const typeSet = typeRegex.map(_ => new Set);

  // length, number of distinct characters, type diversity, number of distinct symbols
  const level = [
    [ 10, 7, 4, 2 ], // strong
    [ 8,  6, 3, 0 ], // medium
    [ 6,  4, 2, 0 ], // weak
    [ 0,  0, 0, 0 ]  // too weak
  ];

  [...str].forEach(c => typeSet[typeRegex.findIndex(e => e.test(c))].add(c));

  let prop = [
    str.length,
    new Set(str).size,
    typeSet.reduce((p, c) => p + (c.size > 0), 0),
    typeSet[3].size
  ];

  let strength = 3 - level.findIndex(a => a.every((min, i) => prop[i] >= min));

  return strength;
}

// ============================================================================================================================ //
//  isValidEmail()                                                                                                              //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Minimal email validation.                                                                                                   //
// ============================================================================================================================ //
export function isValidEmail(str) {
  return /^[^@]+@[^@]+\.[^@]+$/.test(str);
}

// ============================================================================================================================ //
//  jsonEncodeUint8Safe()                                                                                                       //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Performs JSON encoding with each Uint8Array converted to an array of numbers prefixed with 1 and other arrays prefixed      //
//  with 0.                                                                                                                     //
// ============================================================================================================================ //
export function jsonEncodeUint8Safe(obj, space) {
  return JSON.stringify(
    obj,
    function (key, value) {
      if(value instanceof Uint8Array) {
        return [1, ...value];
      }
      else if(Array.isArray(value)) {
        return [0, ...value];
      }
      return value;
    },
    space
  );
}

// ============================================================================================================================ //
//  jsonDecodeUint8Safe()                                                                                                       //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Decodes a string encoded with jsonEncodeUint8Safe().                                                                        //
// ============================================================================================================================ //
export function jsonDecodeUint8Safe(str) {
  return JSON.parse(
    str,
    function (key, value) {
      if(Array.isArray(value)) {
        return value[0] ? new Uint8Array(value.slice(1)) : value.slice(1);
      }
      return value;
    }
  );
}

// ============================================================================================================================ //
//  jsonEncodeBase64()                                                                                                          //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Performs JSON encoding with each Uint8Array converted to a base64-encoded string prefixed with "b_" and other strings       //
//  prefixed with "s_".                                                                                                         //
// ============================================================================================================================ //
export function jsonEncodeBase64(obj, space) {
  return JSON.stringify(
    obj,
    function (key, value) {
      if(typeof value == "string") {
        return "s_" + value;
      }
      else if(value instanceof Uint8Array) {
        return "b_" + base64.encodeBinary(value, base64.BASE64);
      }
      return value;
    },
    space
  );
}

// ============================================================================================================================ //
//  jsonDecodeBase64()                                                                                                          //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Decodes a string encoded with jsonEncodeBase64().                                                                           //
// ============================================================================================================================ //
export function jsonDecodeBase64(str) {
  return JSON.parse(
    str,
    function (key, value) {
      if(typeof value == "string") {
        return value[0] == "b" ? base64.decodeBinary(value.slice(2), base64.BASE64) : value.slice(2);
      }
      return value;
    }
  );
}
