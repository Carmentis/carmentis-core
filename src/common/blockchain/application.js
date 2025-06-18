import { ApplicationVb } from "./applicationVb.js";
import { Crypto } from "../crypto/crypto.js";

export class Application {
  constructor({ provider }) {
    this.vb = new ApplicationVb({ provider });
    this.provider = provider;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create(organizationId) {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setDeclaration({
      organizationId: organizationId
    });
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async setDescription(object) {
    await this.vb.setDescription(object);
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.sign(privateKey);
    return await this.vb.publish();
  }
}
