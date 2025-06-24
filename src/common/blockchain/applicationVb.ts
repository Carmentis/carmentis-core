import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";

export class ApplicationVb extends VirtualBlockchain {
  constructor({
    provider
  }: any) {
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

  async setDeclaration(object: any) {
    await this.addSection(SECTIONS.APP_DECLARATION, object);
  }

  async setDescription(object: any) {
    await this.addSection(SECTIONS.APP_DESCRIPTION, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async setSignature(privateKey: any) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_SIGNATURE, object);
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async declarationCallback(microblock: any, section: any) {
  }

  async signatureCallback(microblock: any, section: any) {
  }

  /**
    Structure check
  */
  // @ts-expect-error TS(2425): Class 'VirtualBlockchain' defines instance member ... Remove this comment to see the full error message
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
