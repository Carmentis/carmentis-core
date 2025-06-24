import { ApplicationVb } from "./applicationVb";
import { Crypto } from "../crypto/crypto";

export class Application {
  provider: any;
  signatureAlgorithmId: any;
  vb: any;
  constructor({
    provider
  }: any) {
    this.vb = new ApplicationVb({ provider });
    this.provider = provider;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create(organizationId: any) {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setDeclaration({
      organizationId: organizationId
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async setDescription(object: any) {
    await this.vb.setDescription(object);
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.sign(privateKey);
    return await this.vb.publish();
  }
}
