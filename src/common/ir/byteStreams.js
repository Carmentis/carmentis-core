import { textEncoder } from "./textEncoder.js";
import * as CST from "./constants.js";

const NUM_SMALL     = 0x80;
const NUM_TYPE      = 0x60;
const NUM_SIZED_INT = 0x00;
const NUM_FLOAT32   = 0x20;
const NUM_FLOAT64   = 0x40;
const NUM_SIZE      = 0x07;
const NUM_SIGN      = 0x08;

export class writeStream {
  constructor() {
    this.clear();
  }

  clear() {
    this.byteStream = [];
  }

  getContent() {
    return new Uint8Array(this.byteStream);
  }

  write(type, value) {
    switch(type) {
      case CST.T_STRING : { this.writeString(value); break; }
      case CST.T_NUMBER : { this.writeNumber(value); break; }
      case CST.T_BOOLEAN: { this.writeBoolean(value); break; }
      case CST.T_NULL   : { break; }
    }
  }

  writeByte(n) {
    this.byteStream.push(n);
  }

  writeArray(arr) {
    for(const n of arr) {
      this.writeByte(n);
    }
  }

  writeString(str) {
    const bin = textEncoder.encode(str);

    this.writeVarUint(bin.length);
    this.writeArray(bin);
  }

  writeVarUint(n) {
    if(n == 0) {
      this.writeByte(0);
    }
    else {
      if(n < 0 || n % 1 || n > Number.MAX_SAFE_INTEGER) {
        throw `Invalid varUint ${n}`;
      }
      while(n) {
        this.writeByte(n % 0x80 | (n > 0x7F) << 7);
        n = Math.floor(n / 0x80);
      }
    }
  }

  writeBoolean(n) {
    this.writeByte(n ? 0xFF : 0x00);
  }

  writeNumber(n) {
    const isInteger = !(n % 1);

    // if this is a small integer in [-64, 63], encode as a single byte
    if(isInteger && n >= -0x40 && n < 0x40) {
      this.writeByte(NUM_SMALL | n & 0x7F);
      return;
    }

    // attempt to encode as 1 prefix byte + 1 to 6 data bytes
    for(let sz = 1, max = 0x100; sz <= 6; sz++, max *= 0x100) {
      // attempt to encode as a signed integer in big-endian format
      if(isInteger && n >= -max && n < max) {
        const sign = n < 0;

        this.writeByte(sign << 3 | sz);

        if(sign) {
          n = -n - 1;
        }
        while(sz--) {
          this.writeByte(n / 2 ** (sz * 8) & 0xFF);
        }
        return;
      }

      // test whether this number can be safely encoded as a Float32
      if(sz == 4) {
        const f32 = new Float32Array([n]);
        const v32 = +f32[0].toPrecision(7);

        if(v32 === n) {
          this.writeByte(NUM_FLOAT32);
          this.writeArray(new Uint8Array(new Float32Array([n]).buffer));
          return;
        }
      }
    }

    // encode as 1 prefix byte + 8 bytes (Float64)
    this.writeByte(NUM_FLOAT64);
    this.writeArray(new Uint8Array(new Float64Array([n]).buffer));
  }
}

export class readStream {
  constructor(stream) {
    this.byteStream = stream;
    this.pointer = 0;
  }

  read(type) {
    this.lastPointer = this.pointer;

    switch(type) {
      case CST.T_STRING : { return this.readString(); }
      case CST.T_NUMBER : { return this.readNumber(); }
      case CST.T_BOOLEAN: { return this.readBoolean(); }
      case CST.T_NULL   : { return null; }
    }
  }

  getPointer() {
    return this.pointer;
  }

  extractFrom(ptr) {
    return this.byteStream.slice(ptr, this.pointer);
  }

  getLastField() {
    return this.byteStream.slice(this.lastPointer, this.pointer);
  }

  readByte() {
    return this.byteStream[this.pointer++];
  }

  readArray(sz) {
    return this.byteStream.slice(this.pointer, this.pointer += sz);
  }

  readString() {
    const size = this.readVarUint(),
          array = this.readArray(size);

    return textEncoder.decode(array);
  }

  readVarUint() {
    const parts = [];
    let v;

    do {
      v = this.readByte();
      parts.push(v & 0x7F);
    } while(v & 0x80);

    return parts.reduceRight((p, c) => p * 0x80 + c, 0);
  }

  readBoolean() {
    return !!this.readByte();
  }

  readNumber() {
    const leadingByte = this.readByte();

    if(leadingByte & NUM_SMALL) {
      return ((leadingByte & 0x7F) ^ 0x40) - 0x40;
    }

    switch(leadingByte & NUM_TYPE) {
      case NUM_FLOAT32: {
        return +new Float32Array(this.readArray(4).buffer)[0].toPrecision(7);
      }
      case NUM_FLOAT64: {
        return new Float64Array(this.readArray(8).buffer)[0];
      }
      default: {
        let n = 0;

        for(let i = leadingByte & NUM_SIZE; i--;) {
          n = n * 0x100 + this.readByte();
        }
        return leadingByte & NUM_SIGN ? -n - 1 : n;
      }
    }
  }
}
