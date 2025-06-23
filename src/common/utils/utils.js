import { DATA } from "../constants/constants.js";
import { TypeManager } from "../data/types.js";

export const Utils = {
  numberToHexa,
  truncateString,
  getNullHash,
  getTimestampInSeconds,
  binaryToHexa,
  binaryFromHexa,
  binaryFrom,
  binaryIsEqual,
  binaryCompare,
  intToByteArray
};

function numberToHexa(value, size) {
  return value.toString(16).toUpperCase().padStart(size || 1, "0");
}

function truncateString(str, size) {
  return str.slice(0, size) + (str.length > size ? "(...)" : "");
}

function getNullHash() {
  return new Uint8Array(32);
}

function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function binaryToHexa(array) {
  if(!(array instanceof Uint8Array)) {
    return "";
  }

  return [...array].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("");
}

function binaryFromHexa(str) {
  return new Uint8Array(
    typeof str == "string" && str.match(/^([\da-f]{2})*$/gi) ?
      str.match(/../g).map((s) => parseInt(s, 16))
    :
      []
  );
}

function binaryFrom(...arg) {
  const list = Array(arg.length);
  let ndx = 0;

  arg.forEach((data, i) => {
    const t = TypeManager.getType(data);

    switch(t) {
      case DATA.TYPE_NUMBER: {
        arg[i] = this.intToByteArray(data);
        break;
      }
      case DATA.TYPE_STRING: {
        arg[i] = encoder.encode(data);
        break;
      }
      case DATA.TYPE_BINARY: {
        break;
      }
      default: {
        throw `unsupported type '${DATA.TYPE_NAMES[t]}' for Utils.binaryFrom()`;
      }
    }
    list[i] = ndx;
    ndx += arg[i].length;
  });

  const arr = new Uint8Array(ndx);

  list.forEach((ndx, i) => {
    arr.set(arg[i], ndx);
  });

  return arr;
}

function binaryIsEqual(a, b) {
  if(!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length != b.length) {
    return false;
  }

  for(const i in a) {
    if(a[i] != b[i]) {
      return false;
    }
  }
  return true;
}

function binaryCompare(a, b) {
  if(!(a instanceof Uint8Array) || !(b instanceof Uint8Array) || a.length != b.length) {
    throw "cannot compare";
  }

  for(const i in a) {
    if(a[i] < b[i]) {
      return -1;
    }
    else if(a[i] > b[i]) {
      return 1;
    }
  }
  return 0;
}

function intToByteArray(n, size = 1) {
  const arr = [];

  while(n || size) {
    arr.push(n % 0x100);
    n = Math.floor(n / 0x100);
    size -= !!size;
  }
  return arr.reverse();
}
