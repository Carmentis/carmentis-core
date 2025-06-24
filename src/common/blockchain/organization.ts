import { SECTIONS } from "../constants/constants";
import { OrganizationVb } from "./organizationVb";
import { Crypto } from "../crypto/crypto";

export class Organization {
  provider: any;
  signatureAlgorithmId: any;
  vb: any;
  constructor({
    provider
  }: any) {
    this.vb = new OrganizationVb({ provider });
    this.provider = provider;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create() {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    if (!this.provider.isKeyed()) throw 'Cannot create an organization without a keyed provider';
    const privateKey = this.provider.getPrivateSignatureKey();
    const publicKey = privateKey.getPublicKey();
    await this.vb.setPublicKey({
      publicKey: publicKey.getRawPublicKey()
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async setDescription(object: any) {
    await this.vb.setDescription(object);
  }

  async getDescription() {
    // TODO (for all similar methods): the state may have changed and there may be a more recent description
    const microblock = await this.vb.getMicroblock(this.vb.state.descriptionHeight);
    const section = microblock.getSection((section: any) => section.type == SECTIONS.ORG_DESCRIPTION);
    return section.object;
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.';
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
