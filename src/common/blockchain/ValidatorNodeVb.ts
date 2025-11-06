import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Organization} from "./Organization";
import {StructureChecker} from "./StructureChecker";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {ValidatorNodeDeclaration, ValidatorNodeDescription, ValidatorNodeRpcEndpoint, ValidatorNodeNetworkIntegration, ValidatorNodeVBState} from "./types";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeVBState> {
  constructor(provider: Provider) {
    super({ provider, type: CHAIN.VB_VALIDATOR_NODE });

    this.registerSectionCallback(SECTIONS.VN_SIG_SCHEME, this.signatureSchemeCallback);
    this.registerSectionCallback(SECTIONS.VN_DECLARATION, this.declarationCallback);
    this.registerSectionCallback(SECTIONS.VN_DESCRIPTION, this.descriptionCallback);
    this.registerSectionCallback(SECTIONS.VN_RPC_ENDPOINT, this.rpcEndpointCallback);
    this.registerSectionCallback(SECTIONS.VN_NETWORK_INTEGRATION, this.networkIntegrationCallback);
    this.registerSectionCallback(SECTIONS.VN_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
   */
  async setSignatureScheme(object: any) {
    await this.addSection(SECTIONS.VN_SIG_SCHEME, object);
  }

  async setDeclaration(object: ValidatorNodeDeclaration) {
    await this.addSection(SECTIONS.VN_DECLARATION, object);
  }

  async setDescription(object: ValidatorNodeDescription) {
    await this.addSection(SECTIONS.VN_DESCRIPTION, object);
  }

  async setRpcEndpoint(object: ValidatorNodeRpcEndpoint) {
    await this.addSection(SECTIONS.VN_RPC_ENDPOINT, object);
  }

  async setNetworkIntegration(object: ValidatorNodeNetworkIntegration) {
    await this.addSection(SECTIONS.VN_NETWORK_INTEGRATION, object);
  }

  async setSignature(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.VN_SIGNATURE, object);
  }

  getDescriptionHeight(): number {
    return this.getState().descriptionHeight;
  }

  getRpcEndpointHeight(): number {
    return this.getState().rpcEndpointHeight;
  }

  getNetworkIntegrationHeight(): number {
    return this.getState().networkIntegrationHeight;
  }

  /**
    Section callbacks
   */
  async signatureSchemeCallback(microblock: any, section: any) {
    this.getState().signatureSchemeId = section.object.schemeId;
  }

  async declarationCallback(microblock: any, section: any) {
    this.getState().organizationId = section.object.organizationId;
  }

  async descriptionCallback(microblock: any, section: any) {
    this.getState().descriptionHeight = microblock.header.height;
  }

  async rpcEndpointCallback(microblock: any, section: any) {
    this.getState().rpcEndpointHeight = microblock.header.height;
  }

  async networkIntegrationCallback(microblock: any, section: any) {
    this.getState().networkIntegrationHeight = microblock.header.height;
  }

  async signatureCallback(microblock: any, section: any) {
    const publicKey = await this.getOrganizationPublicKey();
    const feesPayerAccount = await this.provider.getAccountByPublicKey(publicKey);
    microblock.setFeesPayerAccount(feesPayerAccount);
  }

  async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
    const organization = new Organization({ provider: this.provider });
    await organization._load(this.getState().organizationId);

    return await organization.getPublicKey();
  }

  private static UNDEFINED_SIGNATURE_SCHEME_ID = -1;
  private static UNDEFINED_ORGANIZATION_ID = Utils.getNullHash();
  private static UNDEFINED_DESCRIPTION_HEIGHT = 0;
  private static UNDEFINED_RPC_ENDPOINT_HEIGHT = 0;
  private static UNDEFINED_NETWORK_INTEGRATION_HEIGHT = 0;

  getInitialState(): ValidatorNodeVBState {
    return {
      signatureSchemeId: ValidatorNodeVb.UNDEFINED_SIGNATURE_SCHEME_ID,
      organizationId: ValidatorNodeVb.UNDEFINED_ORGANIZATION_ID,
      descriptionHeight: ValidatorNodeVb.UNDEFINED_DESCRIPTION_HEIGHT,
      rpcEndpointHeight: ValidatorNodeVb.UNDEFINED_RPC_ENDPOINT_HEIGHT,
      networkIntegrationHeight: ValidatorNodeVb.UNDEFINED_NETWORK_INTEGRATION_HEIGHT
    }
  }

  /**
    Structure check
   */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);

    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.VN_SIG_SCHEME
    );
    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.VN_DECLARATION
    );
    checker.group(
      SECTIONS.AT_LEAST_ONE,
      checker.isFirstBlock() ? 
        [
          [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_DESCRIPTION ],
          [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ]
        ]
      :
        [
          [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_DESCRIPTION ],
          [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ],
          [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_NETWORK_INTEGRATION ]
        ]
    );
    checker.expects(SECTIONS.ONE, SECTIONS.VN_SIGNATURE);
    checker.endsHere();
  }
}
