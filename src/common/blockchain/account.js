import { ECO } from "../constants/constants.js";
import { AccountVb } from "./accountVb.js";
import { Utils } from "../utils/utils.js";

export class Account {

  constructor({ provider }) {
    this.vb = new AccountVb({ provider });
    this.provider = provider;
    if (provider.isKeyed()) {
      this.privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = this.privateKey.getSignatureAlgorithmId();
    }
  }

  async _createGenesis() {
    if (!this.provider.isKeyed()) throw "Cannot create a genesis account without a keyed provider."
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    const publicKey = this.privateKey.getPublicKey();
    await this.vb.setPublicKey({
      publicKey: publicKey.getRawPublicKey()
    });

    await this.vb.setTokenIssuance({
      amount: ECO.INITIAL_OFFER
    });
  }

  /**
   *
   * @param {Uint8Array} sellerAccount
   * @param {PublicSignatureKey} buyerPublicKey
   * @param {number} amount
   * @returns {Promise<void>}
   * @private
   */
  async _create(sellerAccount, buyerPublicKey, amount) {
    if (!this.provider.isKeyed()) throw "Cannot create an account without a keyed provider."
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setPublicKey({
      publicKey: buyerPublicKey.getRawPublicKey()
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
    await this.vb.setTransfer({
      account: Utils.binaryFromHexa(object.account),
      amount: object.amount,
      publicReference: object.publicReference,
      privateReference: object.privateReference
    });
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw "Cannot publish updates without a keyed provider.";
    await this.vb.setSignature(this.privateKey);
    return await this.vb.publish();
  }
}
