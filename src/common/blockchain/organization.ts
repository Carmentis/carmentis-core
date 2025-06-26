import {SECTIONS} from "../constants/constants";
import {OrganizationVb} from "./organizationVb";
import {Crypto} from "../crypto/crypto";
import {PrivateSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {OrganizationDescription} from "./types";

export class Organization {
  provider: any;
  signatureAlgorithmId?: SignatureAlgorithmId;
  vb: OrganizationVb;
  gasPrice: number;

  constructor({
    provider
  }: any) {
    this.vb = new OrganizationVb({ provider });
    this.provider = provider;
    this.gasPrice = 0;

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create() {
    if (!this.signatureAlgorithmId) throw 'Cannot create an organization without a signature algorithm';
    await this.vb.setSignatureAlgorithm(this.signatureAlgorithmId);

    if (!this.provider.isKeyed()) throw 'Cannot create an organization without a keyed provider';
    const privateKey: PrivateSignatureKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey(publicKey);
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async setDescription(object: OrganizationDescription) {
    await this.vb.setDescription(object);
  }

  async getDescription() : Promise<OrganizationDescription> {
    // TODO (for all similar methods): the state may have changed and there may be a more recent description
    const microblock = await this.vb.getMicroblock(this.vb.getDescriptionHeight());
    const section = microblock.getSection<OrganizationDescription>(
        (section: any) => section.type == SECTIONS.ORG_DESCRIPTION
    );
    return section.object;
  }

  setGasPrice(gasPrice: number) {
    this.gasPrice = gasPrice;
  }

  getName() : string {
    throw 'Not implemented'
    //return this.vb.state.name;
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
