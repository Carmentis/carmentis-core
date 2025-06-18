import { ValidatorNodeVb } from "./validatorNodeVb.js";
import { Crypto } from "../crypto/crypto.js";

export class ValidatorNode {
  constructor({ provider, publicKey, privateKey }) {
    this.vb = new ValidatorNodeVb({ provider });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _create() {
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async publishUpdates() {
    await this.vb.setSignature(this.privateKey);
    return await this.vb.publish();
  }
}
