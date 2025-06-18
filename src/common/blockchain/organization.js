import { OrganizationVb } from "./organizationVb.js";
import { Crypto } from "../crypto/crypto.js";

export class Organization {
  constructor({ provider, publicKey, privateKey }) {
    this.vb = new OrganizationVb({ provider });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _create() {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setPublicKey({
      publicKey: this.publicKey
    });
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async setDescription(object) {
    await this.vb.setDescription(object);
  }

  async publishUpdates() {
    await this.vb.setSignature(this.privateKey);
    return await this.vb.publish();
  }
}
