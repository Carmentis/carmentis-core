import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class OrganizationVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_ORGANIZATION });

    this.registerSectionCallback(SECTIONS.ORG_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.ORG_PUBLIC_KEY, this.publicKeyCallback);
    this.registerSectionCallback(SECTIONS.ORG_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(object) {
    await this.addSection(SECTIONS.ORG_SIG_ALGORITHM, object);
  }

  async setPublicKey(object) {
    await this.addSection(SECTIONS.ORG_PUBLIC_KEY, object);
  }

  async setDescription(object) {
    await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
  }

  async setSignature(privateKey) {
    const object = this.createSignature(this.state.signatureAlgorithmId, privateKey);
    await this.addSection(SECTIONS.ORG_SIGNATURE, object);
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

  async signatureCallback(microblock, section) {
    const keyMicroblock = await this.getMicroblockByHeight(this.state.publicKeyHeight),
          publicKey = keyMicroblock.getSection(section => section.type == SECTIONS.ORG_PUBLIC_KEY).object.publicKey;

    const valid = microblock.verifySignature(
      this.state.signatureAlgorithmId,
      publicKey,
      section.object.signature,
      true,
      section.index
    );

    if(!valid) {
      throw `invalid signature`;
    }
  }

  /**
    Structure check
  */
  checkStructure(microblock) {
    const checker = new StructureChecker(microblock);

    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.ORG_SIG_ALGORITHM
    );
    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
      SECTIONS.ORG_PUBLIC_KEY
    );
    checker.group(
      SECTIONS.AT_LEAST_ONE,
      [
        [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_DESCRIPTION ],
        [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_SERVER ]
      ]
    );
    checker.expects(SECTIONS.ONE, SECTIONS.ORG_SIGNATURE);
    checker.endsHere();
  }
}
