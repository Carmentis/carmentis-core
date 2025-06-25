import { ECO } from "../constants/constants";
import { AccountVb } from "./accountVb";
import { Utils } from "../utils/utils";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {EncoderFactory} from "../utils/encoder";

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
   * Transfers a specified amount from the account with provided references.
   *
   * @param {Object} object - The transfer details.
   * @param {string} object.account - The account identifier encoded as a string.
   * @param {number} object.amount - The amount to be transferred.
   * @param {string} object.publicReference - The public reference for the transfer.
   * @param {string} object.privateReference - The private reference for the transfer.
   */
  async transfer(object: { account: string, amount: number, publicReference: string, privateReference: string }) {
    const hexEncoder = EncoderFactory.bytesToHexEncoder()
    await this.vb.setTransfer({
      account: hexEncoder.decode(object.account),
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
