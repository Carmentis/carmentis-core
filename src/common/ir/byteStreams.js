import { Utf8Encoder } from "./utf8Encoder.js";
import { DATA } from "./constants/constants.js";

const NUM_SMALL     = 0x80;
const NUM_TYPE      = 0x60;
const NUM_SIZED_INT = 0x00;
const NUM_FLOAT32   = 0x20;
const NUM_FLOAT64   = 0x40;
const NUM_SIZE      = 0x07;
const NUM_SIGN      = 0x08;

export class WriteStream {
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
      case DATA.TYPE_STRING : { this.writeString(value); break; }
      case DATA.TYPE_NUMBER : { this.writeNumber(value); break; }
      case DATA.TYPE_BOOLEAN: { this.writeBoolean(value); break; }
      case DATA.TYPE_NULL   : { break; }
      case DATA.TYPE_UINT8  : { this.writeUint8(value); break; }
      case DATA.TYPE_UINT16 : { this.writeUint16(value); break; }
      case DATA.TYPE_UINT24 : { this.writeUint24(value); break; }
      case DATA.TYPE_UINT32 : { this.writeUint32(value); break; }
      case DATA.TYPE_UINT48 : { this.writeUint48(value); break; }

      default: {
        throw `Unexpected type ${type}`;
      }
    }
  }

  writeByte(n) {
    this.byteStream.push(n & 0xFF);
  }

  writeUnsigned(n, nByte) {
    while(nByte--) {
      this.writeByte(n / 2 ** (nByte * 8));
    }
  }

  writeUint8(n) {
    this.writeUnsigned(n, 1);
  }

  writeUint16(n) {
    this.writeUnsigned(n, 2);
  }

  writeUint24(n) {
    this.writeUnsigned(n, 3);
  }

  writeUint32(n) {
    this.writeUnsigned(n, 4);
  }

  writeUint48(n) {
    this.writeUnsigned(n, 6);
  }

  writeByteArray(arr) {
    for(const n of arr) {
      this.writeByte(n);
    }
  }

  writeString(str) {
    const bin = Utf8Encoder.encode(str);

    this.writeVarUint(bin.length);
    this.writeByteArray(bin);
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
        this.writeUnsigned(sign ? -n - 1 : n, sz);
        return;
      }

      // for size 4, test whether this number can be safely encoded as a Float32
      if(sz == 4) {
        const f32 = new Float32Array([n]);
        const v32 = +f32[0].toPrecision(7);

        if(v32 === n) {
          this.writeByte(NUM_FLOAT32);
          this.writeByteArray(new Uint8Array(f32.buffer));
          return;
        }
      }
    }

    // fallback for everything else: encode as Float64 (1 prefix byte + 8 bytes)
    this.writeByte(NUM_FLOAT64);
    this.writeByteArray(new Uint8Array(new Float64Array([n]).buffer));
  }
}

export class ReadStream {
  constructor(stream) {
    this.byteStream = stream;
    this.pointer = 0;
  }

  read(type) {
    this.lastPointer = this.pointer;

    switch(type) {
      case DATA.TYPE_STRING : { return this.readString(); }
      case DATA.TYPE_NUMBER : { return this.readNumber(); }
      case DATA.TYPE_BOOLEAN: { return this.readBoolean(); }
      case DATA.TYPE_NULL   : { return null; }
      case DATA.TYPE_UINT8  : { return this.readUint8(); }
      case DATA.TYPE_UINT16 : { return this.readUint16(); }
      case DATA.TYPE_UINT24 : { return this.readUint24(); }
      case DATA.TYPE_UINT32 : { return this.readUint32(); }
      case DATA.TYPE_UINT48 : { return this.readUint48(); }
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

  readUnsigned(nByte) {
    let n = 0;

    while(nByte--) {
      n = n * 0x100 + this.readByte();
    }
    return n;
  }

  readUint8() {
    return this.readUnsigned(1);
  }

  readUint16() {
    return this.readUnsigned(2);
  }

  readUint24() {
    return this.readUnsigned(3);
  }

  readUint32() {
    return this.readUnsigned(4);
  }

  readUint48() {
    return this.readUnsigned(6);
  }

  readByteArray(sz) {
    return this.byteStream.slice(this.pointer, this.pointer += sz);
  }

  readString() {
    const size = this.readVarUint(),
          array = this.readByteArray(size);

    return Utf8Encoder.decode(array);
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
        return +new Float32Array(this.readByteArray(4).buffer)[0].toPrecision(7);
      }
      case NUM_FLOAT64: {
        return new Float64Array(this.readByteArray(8).buffer)[0];
      }
      default: {
        const n = this.readUnsigned(leadingByte & NUM_SIZE);

        return leadingByte & NUM_SIGN ? -n - 1 : n;
      }
    }
  }
}
