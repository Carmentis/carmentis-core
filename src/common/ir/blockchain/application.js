import { ApplicationVb } from "./applicationVb.js";
import { Crypto } from "../crypto/crypto.js";

export class Application {
  constructor({ provider, publicKey, privateKey }) {
    this.vb = new ApplicationVb({ provider });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signatureAlgorithmId = Crypto.SECP256K1;
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
    await this.vb.sign(this.privateKey);
    return await this.vb.publish();
  }
}
