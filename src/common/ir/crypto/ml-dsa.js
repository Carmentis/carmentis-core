import { ml_dsa65 } from "@noble/post-quantum/ml-dsa";
import { randomBytes } from "@noble/post-quantum/utils";

export class MLDsa {
  static generateKeyPair(seed) {
    if(seed == undefined) {
      seed = randomBytes(32);
    }

    const keys = ml_dsa65.keygen(seed);

    return { publicKey: keys.publicKey, privateKey: keys.secretKey };
  }

  static sign(privateKey, data) {
    return ml_dsa65.sign(privateKey, data);
  }

  static verify(publicKey, data, signature) {
    return ml_dsa65.verify(publicKey, data, signature);
  }
}
