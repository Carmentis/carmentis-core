export class Utf8Encoder {
  static encoder = new TextEncoder();
  static decoder = new TextDecoder();

  static encode(str) {
    return this.encoder.encode(str);
  }

  static decode(array) {
    return this.decoder.decode(array);
  }
}
