import { DATA } from "../constants/constants";
import { TypeManager } from "../data/types";
import { Utf8Encoder } from "../data/utf8Encoder";

export const Utils = {
  numberToHexa,
  truncateString,
  truncateStringMiddle,
  getNullHash,
  getTimestampInSeconds,
  encodeDay,
  decodeDay,
  dateToDay,
  dayToDate,
  bufferToUint8Array,
  binaryToHexa,
  binaryFromHexa,
  binaryFrom,
  binaryIsEqual,
  binaryCompare,
  intToByteArray
};

function numberToHexa(value: number, size: number) {
  return value.toString(16).toUpperCase().padStart(size || 1, "0");
}

function truncateString(str: string, size: number) {
  return str.slice(0, size) + (str.length > size ? "(...)" : "");
}

function truncateStringMiddle(str: string, leadingSize: number, trailingSize: number) {
  if(str.length <= leadingSize + trailingSize) {
    return str;
  }
  return str.slice(0, leadingSize) + "(...)" + str.slice(str.length - trailingSize);
}

function getNullHash() {
  return new Uint8Array(32);
}

function getTimestampInSeconds() {
  return Math.floor(Date.now() / 1000);
}

function encodeDay(year: number, month: number, day: number) {
  return year << 9 | month << 5 | day;
}

function decodeDay(value: number) {
  const day = value & 0x1F;
  const month = value >> 5 & 0xF;
  const year = value >>> 9;

  return [ year, month, day ];
}

function dateToDay(date: Date) {
  const day = date.getDate();
  const month = date.getMonth() + 1;
  const year = date.getFullYear();

  return encodeDay(year, month, day);
}

function dayToDate(value: number) {
  const [ year, month, day ] = decodeDay(value);

  return new Date(year, month - 1, day);
}

function bufferToUint8Array(b: any) {
  return new Uint8Array(b.buffer, b.byteOffset, b.byteLength / Uint8Array.BYTES_PER_ELEMENT);
}

function binaryToHexa(array: any) {
  if(!(array instanceof Uint8Array)) {
    return "";
  }

  return [...array].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("");
}

function binaryFromHexa(str: any) {
  return new Uint8Array(
    typeof str == "string" && str.match(/^([\da-f]{2})*$/gi) ?
      // @ts-expect-error TS(2531): Object is possibly 'null'.
      str.match(/../g).map((s) => parseInt(s, 16))
    :
      []
  );
}

function binaryFrom(...arg: any[]) {
  const list = Array(arg.length);
  let ndx = 0;

  arg.forEach((data, i) => {
    const t = TypeManager.getType(data);

    switch(t) {
      case DATA.TYPE_NUMBER: {
        arg[i] = intToByteArray(data);
        break;
      }
      case DATA.TYPE_STRING: {
        arg[i] = Utf8Encoder.encode(data);
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

function binaryIsEqual(a: any, b: any) {
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

function binaryCompare(a: any, b: any) {
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

function intToByteArray(n: number, size: number = 1) {
  const arr: number[] = [];

  let remaining = n;

  while (remaining > 0 || size > 0) {
    arr.push(remaining & 0xFF); // same as n % 0x100
    remaining = Math.floor(remaining / 0x100);
    if (size > 0) size--;
  }

  return arr.reverse();
}
