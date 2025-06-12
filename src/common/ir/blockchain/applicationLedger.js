import { ApplicationLedgerVb } from "./applicationLedgerVb.js";
import { Crypto } from "../crypto/crypto.js";

export class ApplicationLedger {
  constructor({ provider, publicKey, privateKey }) {
    this.vb = new ApplicationLedgerVb({ provider });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _create(applicationId) {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async publishUpdates() {
    await this.vb.sign(this.privateKey);
    return await this.vb.publish();
  }
}
