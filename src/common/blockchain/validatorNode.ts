import { ValidatorNodeVb } from "./validatorNodeVb.js";
import { Crypto } from "../crypto/crypto.js";

export class ValidatorNode {
  constructor({ provider }) {
    this.vb = new ValidatorNodeVb({ provider });
    this.provider = provider;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
    //this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _create() {
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
