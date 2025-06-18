import { AccountVb } from "./accountVb.js";
import { Crypto } from "../crypto/crypto.js";

export class Account {
  constructor({ provider, publicKey, privateKey }) {
    this.vb = new AccountVb({ provider });
    this.publicKey = publicKey;
    this.privateKey = privateKey;
    this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _createGenesis() {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setPublicKey({
      publicKey: this.publicKey
    });

    await this.vb.setTokenIssuance({
      amount: 0
    });
  }

  async _create(sellerAccount, buyerPublicKey, amount) {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setPublicKey({
      publicKey: buyerPublicKey
    });

    await this.vb.setCreation({
      sellerAccount: sellerAccount,
      amount: amount
    });
  }

  async _load(identifier) {
    await this.vb.load(identifier);
  }

  async transfer(object) {
    await this.vb.setTransfer(object);
  }

  async publishUpdates() {
    await this.vb.setSignature(this.privateKey);
    return await this.vb.publish();
  }
}
