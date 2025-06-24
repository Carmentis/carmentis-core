import { ValidatorNodeVb } from "./validatorNodeVb";
import { Crypto } from "../crypto/crypto";

export class ValidatorNode {
  provider: any;
  signatureAlgorithmId: any;
  vb: any;
  constructor({
    provider
  }: any) {
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

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
