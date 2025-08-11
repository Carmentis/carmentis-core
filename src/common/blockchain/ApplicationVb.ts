import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Organization} from "./Organization";
import {StructureChecker} from "./StructureChecker";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {ApplicationDeclaration, ApplicationDescription, ApplicationVBState} from "./types";

export class ApplicationVb extends VirtualBlockchain<ApplicationVBState> {
  constructor(provider: Provider) {
    super({ provider, type: CHAIN.VB_APPLICATION });

    this.registerSectionCallback(SECTIONS.APP_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.APP_DECLARATION, this.declarationCallback);
    this.registerSectionCallback(SECTIONS.APP_DESCRIPTION, this.descriptionCallback);
    this.registerSectionCallback(SECTIONS.APP_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(object: any) {
    await this.addSection(SECTIONS.APP_SIG_ALGORITHM, object);
  }

  async setDeclaration(object: ApplicationDeclaration) {
    await this.addSection(SECTIONS.APP_DECLARATION, object);
  }

  async setDescription(object: ApplicationDescription) {
    await this.addSection(SECTIONS.APP_DESCRIPTION, object);
  }

  getDescriptionHeight(): number {
    return this.getState().descriptionHeight;
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async setSignature(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_SIGNATURE, object);
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.getState().signatureAlgorithmId = section.object.algorithmId;
  }

  async declarationCallback(microblock: any, section: any) {
    // TODO: check the organization
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
  private static UNDEFINED_DESCRIPTION_HEIGHT = 0;

  getInitialState(): ApplicationVBState {
    return {
      signatureAlgorithmId: ApplicationVb.UNDEFINED_SIGNATURE_ALGORITHM_ID,
      organizationId: ApplicationVb.UNDEFINED_ORGANIZATION_ID,
      descriptionHeight: ApplicationVb.UNDEFINED_DESCRIPTION_HEIGHT
    }
  }

  /**
    Structure check
  */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);

    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.APP_SIG_ALGORITHM
    );
    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.APP_DECLARATION
    );
    checker.group(
      SECTIONS.AT_LEAST_ONE,
      [
        [ SECTIONS.AT_MOST_ONE, SECTIONS.APP_DESCRIPTION ]
      ]
    );
    checker.expects(SECTIONS.ONE, SECTIONS.APP_SIGNATURE);
    checker.endsHere();
  }
}
