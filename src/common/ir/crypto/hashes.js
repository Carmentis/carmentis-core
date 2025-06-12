import { Utils } from "../utils/utils.js";
import { sha256 as H256 } from "@noble/hashes/sha256";
import { sha512 as H512 } from "@noble/hashes/sha512";

export class Hashes {
  static sha256AsBinary(data) {
    if(!(data instanceof Uint8Array)) {
      throw "Argument passed to compute sha256 is not an instance of Uint8Array";
    }
    return H256(data);
  }

  static sha256(data) {
    return Utils.binaryToHexa(this.sha256AsBinary(data));
  }

  static sha512AsBinary(data) {
    if(!(data instanceof Uint8Array)) {
      throw "Argument passed to compute sha512 is not an instance of Uint8Array";
    }
    return H512(data);
  }

  static sha512(data) {
    return Utils.binaryToHexa(this.sha512AsBinary(data));
  }
}
