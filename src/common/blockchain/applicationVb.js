import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class ApplicationVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_ORGANIZATION });

    this.registerSectionCallback(SECTIONS.APP_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.APP_DECLARATION, this.declarationCallback);
    this.registerSectionCallback(SECTIONS.APP_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(object) {
    await this.addSection(SECTIONS.APP_SIG_ALGORITHM, object);
  }

  async setDeclaration(object) {
    await this.addSection(SECTIONS.APP_DECLARATION, object);
  }

  async setDescription(object) {
    await this.addSection(SECTIONS.APP_DESCRIPTION, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async setSignature(privateKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_SIGNATURE, object);
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock, section) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async declarationCallback(microblock, section) {
  }

  async signatureCallback(microblock, section) {
  }

  /**
    Structure check
  */
  checkStructure(microblock) {
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
