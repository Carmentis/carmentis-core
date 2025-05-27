export class textEncoder {
  static encoder = new TextEncoder();
  static decoder = new TextDecoder();

  static encode(str) {
    return this.encoder.encode(str);
  }

  static decode(array) {
    return this.decoder.decode(array);
  }
}
