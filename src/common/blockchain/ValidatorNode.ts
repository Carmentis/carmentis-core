import {SECTIONS} from "../constants/constants";
import {ValidatorNodeVb} from "./ValidatorNodeVb";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {ValidatorNodeDeclaration, ValidatorNodeDescription, ValidatorNodeNetworkIntegration} from "./types";
import {CMTSToken} from "../economics/currencies/token";
import {Hash} from "../entities/Hash";
import {Provider} from "../providers/Provider";

export class ValidatorNode {
  provider: any;
  signatureAlgorithmId: any;
  vb: ValidatorNodeVb;
  gasPrice: CMTSToken;

  constructor({
      provider
    }: { provider: Provider }) {
    this.vb = new ValidatorNodeVb(provider);
    this.provider = provider;
    this.gasPrice = CMTSToken.zero();

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
      organizationId
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async setDescription(object: ValidatorNodeDescription) {
    await this.vb.setDescription(object);
  }

  async setNetworkIntegration(object: ValidatorNodeNetworkIntegration) {
    await this.vb.setNetworkIntegration(object);
  }

  setGasPrice(gasPrice: CMTSToken) {
    this.gasPrice = gasPrice;
  }

  async getDeclaration() {
    const microblock = await this.vb.getFirstMicroBlock();
    const section = microblock.getSection<ValidatorNodeDeclaration>(
        (section: any) => section.type == SECTIONS.VN_DECLARATION
    );
    return section.object;
  }

  async getDescription() {
    const microblock = await this.vb.getMicroblock(this.vb.getDescriptionHeight());
    const section = microblock.getSection<ValidatorNodeDescription>(
        (section: any) => section.type == SECTIONS.VN_DESCRIPTION
    );
    return section.object;
  }

  async getNetworkIntegration() {
    const height = this.vb.getNetworkIntegrationHeight();

    if(!height) {
      return { votingPower: 0 };
    }

    const microblock = await this.vb.getMicroblock(height);
    const section = microblock.getSection<ValidatorNodeNetworkIntegration>(
        (section: any) => section.type == SECTIONS.VN_NETWORK_INTEGRATION
    );
    return section.object;
  }

  async getOrganizationId(): Promise<Hash> {
    const declaration = await this.getDeclaration();
    return Hash.from(declaration.organizationId);
  }

  async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
    return await this.vb.getOrganizationPublicKey();
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.setSignature(privateKey);
    return await this.vb.publish();
  }
}
