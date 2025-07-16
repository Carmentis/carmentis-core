import { ValidatorNodeVb } from "./ValidatorNodeVb";
import { Crypto } from "../crypto/crypto";
import {CMTSToken} from "../economics/currencies/token";

export class ValidatorNode {
  provider: any;
  signatureAlgorithmId: any;
  vb: any;
  gasPrice: CMTSToken;

  constructor({
    provider
  }: any) {
    this.vb = new ValidatorNodeVb({ provider });
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
    //this.signatureAlgorithmId = Crypto.SECP256K1;
  }

  async _create() {
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
