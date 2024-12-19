import { DATA, ERRORS } from "../constants/constants.js";
import * as textEncoder from "../util/textEncoder.js";
import * as type from "../util/type.js";
import * as uint8 from "../util/uint8.js";
import * as currency from "../util/currency.js";
import { fieldError } from "../errors/error.js";

// ============================================================================================================================ //
//  encodeSingle()                                                                                                              //
// ============================================================================================================================ //
export function encodeSingle(def, item, context = {}) {
  let stream = getWriteStream();

  stream.encode(def, item, context);

  return stream.getContent();
}

// ============================================================================================================================ //
//  decodeSingle()                                                                                                              //
// ============================================================================================================================ //
export function decodeSingle(def, array, context = {}) {
  let stream = getReadStream(array, context);

  return stream.decode(def);
}

// ============================================================================================================================ //
//  getWriteStream()                                                                                                            //
// ============================================================================================================================ //
export function getWriteStream(context = {}) {
  let array = [],
      lastFieldPtr;

  let stream = {
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  encode()                                                                                                                //
    // ------------------------------------------------------------------------------------------------------------------------ //
    encode: function(def, item, name) {
      lastFieldPtr = array.length;
      encodeField(stream, def, item, name, context);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getLastFieldData()                                                                                                      //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getLastFieldData: function() {
      return new Uint8Array(array.slice(lastFieldPtr));
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  writeUnsigned()                                                                                                         //
    // ------------------------------------------------------------------------------------------------------------------------ //
    writeUnsigned: function(value, nByte) {
      while(nByte--) {
        array.push(value >> nByte * 8 & 0xFF);
      }
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  writeVarUint()                                                                                                          //
    // ------------------------------------------------------------------------------------------------------------------------ //
    writeVarUint: function(value) {
      if(value == 0) {
        array.push(0);
      }
      else {
        while(value) {
          array.push(value % 0x80 | (value > 0x7F) << 7);
          value = Math.floor(value / 0x80);
        }
      }
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  writeVarInt()                                                                                                           //
    // ------------------------------------------------------------------------------------------------------------------------ //
    writeVarInt: function(value) {
      let sign = value < 0;

      if(sign) {
        value = -value;
      }

      if(value == 0) {
        array.push(0);
      }
      else {
        array.push((value % 0x40) << 1 | sign | (value > 0x3F) << 7);
        value = Math.floor(value / 0x40);

        while(value) {
          array.push(value % 0x80 | (value > 0x7F) << 7);
          value = Math.floor(value / 0x80);
        }
      }
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  writeArray()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    writeArray: function(data) {
      array = [ ...array, ...data ];
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  setByte()                                                                                                               //
    // ------------------------------------------------------------------------------------------------------------------------ //
    setByte: function(ptr, value) {
      array[ptr] = value;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getPointer()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getPointer: function() {
      return array.length;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getContent()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getContent: function() {
      return new Uint8Array(array);
    }
  };

  return stream;
}

// ============================================================================================================================ //
//  getReadStream()                                                                                                             //
// ============================================================================================================================ //
export function getReadStream(array, context = {}) {
  context.ptr = context.ptr || 0;

  let ptr = context.ptr,
      lastFieldStartPtr,
      lastFieldEndPtr;

  let stream = {
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  decode()                                                                                                                //
    // ------------------------------------------------------------------------------------------------------------------------ //
    decode: function(def) {
      lastFieldStartPtr = ptr;

      let res = decodeField(stream, def, context);

      lastFieldEndPtr = ptr;

      return res;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getLastFieldData()                                                                                                      //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getLastFieldData: function() {
      return array.slice(lastFieldStartPtr, lastFieldEndPtr);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  readUnsigned()                                                                                                          //
    // ------------------------------------------------------------------------------------------------------------------------ //
    readUnsigned: function(nByte) {
      let value = 0;

      while(nByte--) {
        value = value << 8 | array[ptr++];
      }
      return value >>> 0;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  readVarUint()                                                                                                           //
    // ------------------------------------------------------------------------------------------------------------------------ //
    readVarUint: function() {
      let parts = [];

      do {
        parts.push(array[ptr] & 0x7F);
      } while(array[ptr++] & 0x80);

      return parts.reduceRight((p, c) => p * 0x80 + c, 0);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  readVarInt()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    readVarInt: function() {
      let parts = [ array[ptr] >> 1 & 0x3F ],
          sign = array[ptr] & 0x1;

      while(array[ptr++] & 0x80) {
        parts.push(array[ptr] & 0x7F);
      }

      let value = parts.reduceRight((p, c, i) => p * (i ? 0x80 : 0x40) + c, 0);

      return sign ? -value : value;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  readArray()                                                                                                             //
    // ------------------------------------------------------------------------------------------------------------------------ //
    readArray: function(n) {
      return array.slice(ptr, ptr += n);
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  getPointer()                                                                                                            //
    // ------------------------------------------------------------------------------------------------------------------------ //
    getPointer: function() {
      return ptr;
    }
  };

  return stream;
}

// ============================================================================================================================ //
//  encodeField()                                                                                                               //
// ============================================================================================================================ //
function encodeField(stream, def, item, name, context) {
  name = name || "(unnamed)";

  checkFieldType(item, def, name);

  switch(def.type & DATA.MSK_TYPE) {
    case DATA.INT: {
      stream.writeVarInt(item);
      break;
    }
    case DATA.UINT: {
      stream.writeVarUint(item);
      break;
    }
    case DATA.UINT8: {
      stream.writeUnsigned(item, 1);
      break;
    }
    case DATA.UINT16: {
      stream.writeUnsigned(item, 2);
      break;
    }
    case DATA.UINT24: {
      stream.writeUnsigned(item, 3);
      break;
    }
    case DATA.UINT32: {
      stream.writeUnsigned(item, 4);
      break;
    }
    case DATA.UINT48: {
      stream.writeUnsigned(item / 0x100000000, 2);
      stream.writeUnsigned(item, 4);
      break;
    }
    case DATA.STRING: {
      let bin = textEncoder.encode(item);

      if(def.size == undefined) {
        stream.writeVarUint(bin.length);
      }
      stream.writeArray(bin);
      break;
    }
    case DATA.TIMESTAMP: {
      stream.writeUnsigned(item / 0x100000000 & 0xFFFF, 2);
      stream.writeUnsigned(item / 0x10000 & 0xFFFF, 2);
      stream.writeUnsigned(item & 0xFFFF, 2);
      break;
    }
    case DATA.AMOUNT: {
      stream.writeUnsigned(currency.encode(item));
      break;
    }
    case DATA.HASH: {
      stream.writeArray(uint8.fromHexa(item));
      break;
    }
    case DATA.BINARY: {
      if(def.size == undefined) {
        stream.writeVarUint(item.length);
      }
      stream.writeArray(item);
      break;
    }
    case DATA.BIN128:
    case DATA.BIN256:
    case DATA.BIN264:
    case DATA.BIN512: {
      stream.writeArray(item);
      break;
    }
    case DATA.PUB_KEY:
    case DATA.PRIV_KEY:
    case DATA.AES_KEY:
    case DATA.SIGNATURE: {
      stream.writeArray(uint8.fromHexa(item));
      break;
    }
  }
}

// ============================================================================================================================ //
//  decodeField()                                                                                                               //
// ============================================================================================================================ //
function decodeField(stream, def, context) {
  let item;

  switch(def.type & DATA.MSK_TYPE) {
    case DATA.INT: {
      item = stream.readVarInt();
      break;
    }
    case DATA.UINT: {
      item = stream.readVarUint();
      break;
    }
    case DATA.UINT8: {
      item = stream.readUnsigned(1);
      break;
    }
    case DATA.UINT16: {
      item = stream.readUnsigned(2);
      break;
    }
    case DATA.UINT24: {
      item = stream.readUnsigned(3);
      break;
    }
    case DATA.UINT32: {
      item = stream.readUnsigned(4);
      break;
    }
    case DATA.UINT48: {
      item = stream.readUnsigned(2) * 0x100000000 + stream.readUnsigned(4);
      break;
    }
    case DATA.STRING: {
      let size = def.size == undefined ? stream.readVarUint() : def.size,
          array = stream.readArray(size);

      item = textEncoder.decode(array);
      break;
    }
    case DATA.HASH: {
      item = uint8.toHexa(stream.readArray(32));
      break;
    }
    case DATA.BINARY: {
      let size = def.size == undefined ? stream.readVarUint() : def.size;

      item = stream.readArray(size);
      break;
    }
    case DATA.BIN128: {
      item = stream.readArray(16);
      break;
    }
    case DATA.BIN256: {
      item = stream.readArray(32);
      break;
    }
    case DATA.BIN264: {
      item = stream.readArray(33);
      break;
    }
    case DATA.BIN512: {
      item = stream.readArray(64);
      break;
    }
    case DATA.PUB_KEY: {
      item = uint8.toHexa(stream.readArray(33));
      break;
    }
    case DATA.PRIV_KEY:
    case DATA.AES_KEY: {
      item = uint8.toHexa(stream.readArray(32));
      break;
    }
    case DATA.SIGNATURE: {
      item = uint8.toHexa(stream.readArray(64));
      break;
    }
  }

  return item;
}

// ============================================================================================================================ //
//  checkFieldType()                                                                                                            //
// ============================================================================================================================ //
function checkFieldType(item, def, name) {
  let itemType = type.getType(item);

  switch(def.type & DATA.MSK_TYPE) {
    case DATA.INT      : { return isVarInt(); }
    case DATA.UINT     : { return isVarUint(); }
    case DATA.UINT8    : { return isUint(8); }
    case DATA.UINT16   : { return isUint(16); }
    case DATA.UINT24   : { return isUint(24); }
    case DATA.UINT32   : { return isUint(32); }
    case DATA.UINT48   : { return isUint(48); }
    case DATA.STRING   : { return hasType(type.STRING) && checkSize(); }
    case DATA.OBJECT   : { return hasType(type.OBJECT); }
    case DATA.ARRAY    : { return hasType(type.ARRAY) && checkSize(); }
    case DATA.HASH     : { return isHexa(64); }
    case DATA.PUB_KEY  : { return isPublicKey(); }
    case DATA.PRIV_KEY : { return isHexa(64); }
    case DATA.AES_KEY  : { return isHexa(64); }
    case DATA.SIGNATURE: { return isHexa(128); }
    case DATA.BINARY   : { return hasType(type.UINT8) && checkSize(); }
    case DATA.BIN128   : { return hasType(type.UINT8) && hasFixedSize(16); }
    case DATA.BIN256   : { return hasType(type.UINT8) && hasFixedSize(32); }
    case DATA.BIN264   : { return hasType(type.UINT8) && hasFixedSize(33); }
    case DATA.BIN512   : { return hasType(type.UINT8) && hasFixedSize(64); }
  }

  function hasType(n) {
    if(itemType != n) {
      throw new fieldError(ERRORS.FIELD_BAD_TYPE, name, type.NAME[itemType], type.NAME[n]);
    }
    return true;
  }

  function isInt(unsigned) {
    hasType(type.NUMBER);

    if(item % 1 != 0) {
      throw new fieldError(ERRORS.FIELD_NOT_INTEGER, name);
    }
    if(unsigned && item < 0) {
      throw new fieldError(ERRORS.FIELD_NOT_UNSIGNED, name);
    }
    return true;
  }

  function isVarInt() {
    isInt(false);

    if(item < Number.MIN_SAFE_INTEGER || item > Number.MAX_SAFE_INTEGER) {
      throw new fieldError(ERRORS.FIELD_OUT_OF_RANGE, name, Number.MIN_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    }
    return true;
  }

  function isVarUint() {
    isInt(true);

    if(item > Number.MAX_SAFE_INTEGER) {
      throw new fieldError(ERRORS.FIELD_OUT_OF_RANGE, name, 0, Number.MAX_SAFE_INTEGER);
    }
    return true;
  }

  function isUint(w) {
    isInt(true);

    if(item >= 2 ** w) {
      throw new fieldError(ERRORS.FIELD_UINT_TOO_LARGE, name, 2 ** w - 1);
    }
    return true;
  }

  function checkSize() {
    if(def.size != undefined && item.length != def.size) {
      throw new fieldError(ERRORS.FIELD_INVALID_SIZE, name, def.size);
    }
    if(item.length > def.maxSize) {
      throw new fieldError(ERRORS.FIELD_SIZE_TOO_LARGE, name, def.maxSize);
    }
    if(item.length < def.minSize) {
      throw new fieldError(ERRORS.FIELD_SIZE_TOO_SMALL, name, def.minSize);
    }
    return true;
  }

  function hasFixedSize(n) {
    if(item.length != n) {
      throw new fieldError(ERRORS.FIELD_INVALID_SIZE, name, n);
    }
    return true;
  }

  function isPublicKey() {
    isHexa(66);

    if(!/^0(2|3)/.test(item)) {
      throw new fieldError(ERRORS.FIELD_NOT_PUBLIC_KEY, name);
    }
  }

  function isHexa(size) {
    hasType(type.STRING);
    hasFixedSize(size);

    if(!/^[\dA-F]*$/.test(item)) {
      throw new fieldError(ERRORS.FIELD_NOT_HEXA, name);
    }
    return true;
  }
}
