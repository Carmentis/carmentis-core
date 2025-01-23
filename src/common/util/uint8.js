import * as type    from "./type.js";
import * as util    from "./util.js";
import * as encoder from "./textEncoder.js";

// ============================================================================================================================ //
//  toHexa()                                                                                                                    //
// ============================================================================================================================ //
export function toHexa(array) {
  if(!(array instanceof Uint8Array) && !Array.isArray(array)) {
    return "";
  }

  return [...array].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join("");
}

// ============================================================================================================================ //
//  fromHexa()                                                                                                                  //
// ============================================================================================================================ //
export function fromHexa(str) {
  return new Uint8Array(typeof str == "string" && str.match(/^([\da-f]{2})*$/gi) ? str.match(/../g).map(s => parseInt(s, 16)) : []);
}

// ============================================================================================================================ //
//  formatHash()                                                                                                                //
// ============================================================================================================================ //
export function formatHash(array, shortened) {
  let str = toHexa(array);

  return "0x" + (shortened ? str.slice(0, shortened) + " \u22EF " + str.slice(-2) : str);
}

// ============================================================================================================================ //
//  writeX()                                                                                                                    //
// ============================================================================================================================ //
export function write8(array, data, pos) {
  array.set([ data & 0xFF ], pos);
}

export function write16(array, data, pos) {
  array.set([ data >> 8 & 0xFF, data & 0xFF ], pos);
}

export function write24(array, data, pos) {
  array.set([ data >> 16 & 0xFF, data >> 8 & 0xFF, data & 0xFF ], pos);
}

export function write32(array, data, pos) {
  array.set([ data >> 24 & 0xFF, data >> 16 & 0xFF, data >> 8 & 0xFF, data & 0xFF ], pos);
}

export function write48(array, data, pos) {
  write24(array, data / 0x1000000, pos);
  write24(array, data, pos + 3);
}

// ============================================================================================================================ //
//  readX()                                                                                                                     //
// ============================================================================================================================ //
export function read8(array, pos) {
  return array[pos];
}

export function read16(array, pos) {
  return array[pos] << 8 | array[pos + 1];
}

export function read24(array, pos) {
  return array[pos] << 16 | array[pos + 1] << 8 | array[pos + 2];
}

export function read32(array, pos) {
  return array[pos] << 24 | array[pos + 1] << 16 | array[pos + 2] << 8 | array[pos + 3];
}

export function read48(array, pos) {
  return read24(array, pos) * 0x1000000 + read24(array, pos + 3);
}

// ============================================================================================================================ //
//  from()                                                                                                                      //
// ============================================================================================================================ //
export function from(...arg) {
  let list = Array(arg.length),
      ndx = 0;

  arg.forEach((data, i) => {
    switch(type.getType(data)) {
      case type.NUMBER: {
        arg[i] = util.intToByteArray(data);
        break;
      }
      case type.STRING: {
        arg[i] = encoder.encode(data);
        break;
      }
    }
    list[i] = ndx;
    ndx += arg[i].length;
  });

  let arr = new Uint8Array(ndx);

  list.forEach((ndx, i) => {
    arr.set(arg[i], ndx);
  });

  return arr;
}

// ============================================================================================================================ //
//  fromBuffer()                                                                                                                //
// ============================================================================================================================ //
export function fromBuffer(buffer, offset = 0) {
  return new Uint8Array(buffer.buffer, buffer.byteOffset + offset, buffer.byteLength - offset);
}

// ============================================================================================================================ //
//  isEqual()                                                                                                                   //
// ============================================================================================================================ //
export function isEqual(a, b) {
  if(!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length != b.length) {
    return false;
  }

  for(let i = 0; i < a.length; i++) {
    if(a[i] != b[i]) {
      return false;
    }
  }
  return true;
}
