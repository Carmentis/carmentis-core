import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./virtualBlockchain";
import {Organization} from "./organization";
import {StructureChecker} from "./structureChecker";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/provider";
import {ValidatorNodeDeclaration, ValidatorNodeDescription, ValidatorNodeVBState} from "./types";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeVBState> {
  constructor(provider: Provider) {
    super({ provider, type: CHAIN.VB_VALIDATOR_NODE });

    this.registerSectionCallback(SECTIONS.VN_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.VN_DECLARATION, this.declarationCallback);
    this.registerSectionCallback(SECTIONS.VN_DESCRIPTION, this.descriptionCallback);
    this.registerSectionCallback(SECTIONS.VN_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
   */
  async setSignatureAlgorithm(object: any) {
    await this.addSection(SECTIONS.VN_SIG_ALGORITHM, object);
  }

  async setDeclaration(object: ValidatorNodeDeclaration) {
    await this.addSection(SECTIONS.VN_DECLARATION, object);
  }

  async setDescription(object: ValidatorNodeDescription) {
    await this.addSection(SECTIONS.VN_DESCRIPTION, object);
  }

  async setSignature(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.VN_SIGNATURE, object);
  }

  getDescriptionHeight(): number {
    return this.getState().descriptionHeight;
  }

  /**
    Section callbacks
   */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.getState().signatureAlgorithmId = section.object.algorithmId;
  }

  async declarationCallback(microblock: any, section: any) {
    this.getState().organizationId = section.object.organizationId;
  }

  async descriptionCallback(microblock: any, section: any) {
    this.getState().descriptionHeight = microblock.header.height;
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

  private static UNDEFINED_SIGNATURE_ALGORITHM_ID = -1;
  private static UNDEFINED_ORGANIZATION_ID = Utils.getNullHash();
  private static UNDEFINED_DESCRIPTION_HEIGHT = -1;

  getInitialState(): ValidatorNodeVBState {
    return {
      signatureAlgorithmId: ValidatorNodeVb.UNDEFINED_SIGNATURE_ALGORITHM_ID,
      organizationId: ValidatorNodeVb.UNDEFINED_ORGANIZATION_ID,
      descriptionHeight: ValidatorNodeVb.UNDEFINED_DESCRIPTION_HEIGHT
    }
  }

  /**
    Structure check
   */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);

    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.VN_SIG_ALGORITHM
    );
    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.VN_DECLARATION
    );
    checker.group(
      SECTIONS.AT_LEAST_ONE,
      [
        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_DESCRIPTION ]
      ]
    );
    checker.expects(SECTIONS.ONE, SECTIONS.VN_SIGNATURE);
    checker.endsHere();
  }
}
