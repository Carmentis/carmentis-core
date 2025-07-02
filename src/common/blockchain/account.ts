import {ECO} from "../constants/constants";
import {AccountVb} from "./accountVb";
import {Utils} from "../utils/utils";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {EncoderFactory} from "../utils/encoder";
import {AccountTransfer} from "./types";
import {CryptoSchemeFactory} from "../crypto/factory";

export class Account {
  privateKey: any;
  provider: any;
  signatureAlgorithmId: any;
  vb: AccountVb;
  gasPrice: number;

  constructor({
    provider
  }: any) {
    this.vb = new AccountVb({ provider });
    this.provider = provider;
    this.gasPrice = 0;

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

    const publicKey: PublicSignatureKey = this.privateKey.getPublicKey();
    await this.vb.setPublicKey(publicKey);

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
  async _create(sellerAccount: Uint8Array, buyerPublicKey: PublicSignatureKey, amount: number) {
    if (!this.provider.isKeyed()) throw "Cannot create an account without a keyed provider."
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setPublicKey(buyerPublicKey);

    await this.vb.setCreation({
      sellerAccount: sellerAccount,
      amount: amount
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  /**
   * Retrieves the public key for the current instance of the cryptographic context.
   *
   * The method fetches the raw public key and the signature algorithm ID, then utilizes the CryptoSchemeFactory
   * to create and return a public signature key object.
   *
   * @return {Promise<PublicSignatureKey>} A promise that resolves to a public signature key object.
   */
  async getPublicKey() {
    const rawPublicKey = await this.vb.getPublicKey();
    const algorithmId = await this.vb.getSignatureAlgorithmId();
    const factory = new CryptoSchemeFactory();
    return factory.createPublicSignatureKey(algorithmId, rawPublicKey);
  }

  async transfer(object: AccountTransfer) {
    await this.vb.setTransfer({
      account: object.account,
      amount: object.amount,
      publicReference: object.publicReference,
      privateReference: object.privateReference
    });
  }

  setGasPrice(gasPrice: number) {
    this.gasPrice = gasPrice;
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw "Cannot publish updates without a keyed provider.";
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(this.privateKey);
    return await this.vb.publish();
  }
}
