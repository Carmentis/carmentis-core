import { ml_kem768 } from "@noble/post-quantum/ml-kem";
import { randomBytes } from "@noble/post-quantum/utils";

export class MLKem {
  static generateKeyPair(seed) {
    if(seed == undefined) {
      seed = randomBytes(64);
    }

    const keys = ml_kem768.keygen(seed);

    return keys;
  }

  static encapsulate(publicKey) {
    return ml_kem768.encapsulate(publicKey);
  }

  static decapsulate(cipherText, privateKey) {
    return ml_kem768.decapsulate(cipherText, privateKey);
  }
}
