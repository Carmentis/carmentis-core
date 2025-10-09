import {SECTIONS} from "../constants/constants";
import {ProtocolVb} from "./ProtocolVb";
import {Crypto} from "../crypto/crypto";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {CMTSToken} from "../economics/currencies/token";

export class Protocol {
  provider: any;
  signatureAlgorithmId?: SignatureAlgorithmId;
  vb: ProtocolVb;
  gasPrice: CMTSToken;

  constructor({
    provider
  }: any) {
    this.vb = new ProtocolVb({ provider });
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create() {
    if (typeof this.signatureAlgorithmId === 'undefined') throw 'Cannot create a protocol VB without a signature algorithm';
    await this.vb.setSignatureAlgorithm(this.signatureAlgorithmId);

    if (!this.provider.isKeyed()) throw 'Cannot create a protocol VB without a keyed provider';
    const privateKey: PrivateSignatureKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey(publicKey);
  }

  async _load(identifier: Uint8Array) {
    await this.vb.load(identifier);
  }

  async getPublicKey() : Promise<PublicSignatureKey> {
    return await this.vb.getPublicKey();
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  getName() : string {
    throw 'Not implemented'
  }

  async publishUpdates(waitForAnchoring = true) {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish(waitForAnchoring);
  }
}
