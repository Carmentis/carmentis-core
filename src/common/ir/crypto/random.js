import { Utils } from "../utils/utils.js";
import { randomBytes } from "@noble/hashes/utils";

export class Random {
  static getBytes(n) {
    return randomBytes(n);
  }

  static getInteger(max) {
    const rand = this.getBytes(6);
    let v = 0;

    for(let i = 0; i < 6; i++) {
      v = v * 256 + rand[i];
    }

    return Math.floor(v / 2 ** 48 * max);
  }

  static getKey256() {
    const key = this.getBytes(32);

    return Utils.binaryToHexa(key);
  }
}
