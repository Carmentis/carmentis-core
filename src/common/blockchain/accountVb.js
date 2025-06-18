import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class AccountVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_ACCOUNT });

    this.registerSectionCallback(SECTIONS.ACCOUNT_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_PUBLIC_KEY, this.publicKeyCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, this.tokenIssuanceCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_CREATION, this.creationCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_TRANSFER, this.transferCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(object) {
    await this.addSection(SECTIONS.ACCOUNT_SIG_ALGORITHM, object);
  }

  async setPublicKey(object) {
    await this.addSection(SECTIONS.ACCOUNT_PUBLIC_KEY, object);
  }

  async setTokenIssuance(object) {
    await this.addSection(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, object);
  }

  async setCreation(object) {
    await this.addSection(SECTIONS.ACCOUNT_CREATION, object);
  }

  async setTransfer(object) {
    await this.addSection(SECTIONS.ACCOUNT_TRANSFER, object);
  }

  async setSignature(privateKey) {
    const object = this.createSignature(this.state.signatureAlgorithmId, privateKey);
    await this.addSection(SECTIONS.ACCOUNT_SIGNATURE, object);
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock, section) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async publicKeyCallback(microblock, section) {
    this.state.publicKeyHeight = microblock.header.height;
  }

  async tokenIssuanceCallback(microblock, section) {
  }

  async creationCallback(microblock, section) {
  }

  async transferCallback(microblock, section) {
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
      SECTIONS.ACCOUNT_SIG_ALGORITHM
    );
    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
      SECTIONS.ACCOUNT_PUBLIC_KEY
    );
    if(checker.isFirstBlock()) {
      checker.group(
        SECTIONS.ONE,
        [
          [ SECTIONS.AT_MOST_ONE, SECTIONS.ACCOUNT_TOKEN_ISSUANCE ],
          [ SECTIONS.AT_MOST_ONE, SECTIONS.ACCOUNT_CREATION ]
        ]
      )
    }
    else {
      checker.group(
        SECTIONS.AT_LEAST_ONE,
        [
          [ SECTIONS.ANY, SECTIONS.ACCOUNT_TRANSFER ]
        ]
      );
    }
    checker.expects(SECTIONS.ONE, SECTIONS.ACCOUNT_SIGNATURE);
    checker.endsHere();
  }
}
