import {Utils} from "./utils";
import {BytesToBase64Encoder} from "./encoder";

describe('binaryFrom', () => {
  it('should correctly encode and decode three numbers', () => {
    expect(Utils.binaryFrom(1, 0, 2)).toBeInstanceOf(Uint8Array);
    expect(
      Utils.binaryFrom(1, 0, new Uint8Array(Utils.intToByteArray(2, 6)))
    ).toBeInstanceOf(Uint8Array);
  });
});

describe('BytesToBase64Encoder', () => {
  const encoder = new BytesToBase64Encoder();

  it('encodes empty byte array to empty string and decodes empty string to empty byte array', () => {
    const empty = new Uint8Array();
    expect(encoder.encode(empty)).toBe("");
    expect(encoder.decode("")).toEqual(empty);
  });

  it('encodes known vectors with standard base64 alphabet and padding', () => {
    expect(encoder.encode(new Uint8Array([0x00]))).toBe("AA==");
    expect(encoder.encode(new Uint8Array([0xff]))).toBe("/w==");
    expect(encoder.encode(new Uint8Array([0x66]))).toBe("Zg=="); // 'f'
    expect(encoder.encode(new Uint8Array([0x4d, 0x61, 0x6e]))).toBe("TWFu"); // 'Man'
    expect(encoder.encode(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]))).toBe("aGVsbG8="); // 'hello'
  });

  it('decodes known base64 strings (with and without padding) to expected bytes', () => {
    expect(encoder.decode("AA==")).toEqual(new Uint8Array([0x00]));
    expect(encoder.decode("/w==")).toEqual(new Uint8Array([0xff]));
    expect(encoder.decode("Zg==")).toEqual(new Uint8Array([0x66]));
    // Without padding: should still decode correctly because implementation auto-pads
    expect(encoder.decode("TWE")).toEqual(new Uint8Array([0x4d, 0x61])); // 'Ma'
    expect(encoder.decode("aGVsbG8=")).toEqual(new Uint8Array([0x68, 0x65, 0x6c, 0x6c, 0x6f]));
  });

  it('round-trips various byte lengths correctly', () => {
    const samples: Uint8Array[] = [];
    // deterministic sample generation
    for (let len = 1; len <= 32; len++) {
      const arr = new Uint8Array(len);
      for (let i = 0; i < len; i++) arr[i] = (i * 37 + len) & 0xff;
      samples.push(arr);
    }
    for (const s of samples) {
      const b64 = encoder.encode(s);
      const back = encoder.decode(b64);
      expect(back).toEqual(s);
      // encoded string should be multiple of 4 characters when non-empty
      if (s.length > 0) expect(b64.length % 4).toBe(0);
    }
  });
});