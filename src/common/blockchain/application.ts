import {SECTIONS} from "../constants/constants";
import {ApplicationVb} from "./applicationVb";
import {Crypto} from "../crypto/crypto";
import {ApplicationDeclaration, ApplicationDescription, Hash} from "./types";
import {Provider} from "../providers/provider";

export class Application {
  provider: any;
  signatureAlgorithmId: any;
  vb: ApplicationVb;
  gasPrice: number;

  constructor({
      provider
    }: { provider: Provider }) {
    this.vb = new ApplicationVb(provider);
    this.provider = provider;
    this.gasPrice = 0;

    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create(organizationId: any) {
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });

    await this.vb.setDeclaration({
      organizationId: organizationId
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async setDescription(object: ApplicationDescription) {
    await this.vb.setDescription(object);
  }

  setGasPrice(gasPrice: number) {
    this.gasPrice = gasPrice;
  }

  async getDeclaration() {
    const microblock = await this.vb.getMicroblock(1);
    const section = microblock.getSection<ApplicationDeclaration>(
        (section: any) => section.type == SECTIONS.APP_DECLARATION
    );
    return section.object;
  }

  async getDescription() {
    const microblock = await this.vb.getMicroblock(this.vb.getDescriptionHeight());
    const section = microblock.getSection<ApplicationDescription>(
        (section: any) => section.type == SECTIONS.APP_DESCRIPTION
    );
    return section.object;
  }

  async getOrganizationId() {
    const declaration = await this.getDeclaration();
    return Hash.from(declaration.organizationId)
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
