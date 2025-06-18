import { OrganizationVb } from "./organizationVb.js";
import { Crypto } from "../crypto/crypto.js";

export class Organization {
  constructor({ provider }) {
    this.vb = new OrganizationVb({ provider });
    this.provider = provider;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create() {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    if (!this.provider.isKeyed()) throw 'Cannot create an organisation without a keyed provider';
    const privateKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey({
      publicKey: publicKey.getRawPublicKey()
    });
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async setDescription(object) {
    await this.vb.setDescription(object);
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
