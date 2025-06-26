import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {Provider} from "../providers/provider";
import {ApplicationDeclaration, ApplicationDescription, ApplicationVBState} from "./types";

export class ApplicationVb extends VirtualBlockchain<ApplicationVBState> {
  constructor(provider: Provider) {
    super({ provider, type: CHAIN.VB_ORGANIZATION });

    this.registerSectionCallback(SECTIONS.APP_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.APP_DECLARATION, this.declarationCallback);
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

  async getDeclaration() {
    if (!this.currentMicroblock) throw new Error("no current microblock");
    return this.currentMicroblock.getSection<ApplicationDeclaration>((
        section: any) => section.type == SECTIONS.APP_DECLARATION
    ).object;
  }

  async getDescription() {
    if (!this.currentMicroblock) throw new Error("no current microblock");
    return this.currentMicroblock.getSection<ApplicationDescription>((
        section: any) => section.type == SECTIONS.APP_DESCRIPTION
    ).object;
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
  }

  async signatureCallback(microblock: any, section: any) {
  }

  private static UNDEFINED_SIGNATURE_ALGORITHM_ID = -1;
  getInitialState(): ApplicationVBState {
    return {
      signatureAlgorithmId: ApplicationVb.UNDEFINED_SIGNATURE_ALGORITHM_ID
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
