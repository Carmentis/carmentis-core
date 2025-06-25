import { CHAIN, ECO, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";

export class AccountVb extends VirtualBlockchain {
  constructor({
    provider
  }: any) {
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
  async setSignatureAlgorithm(object: any) {
    await this.addSection(SECTIONS.ACCOUNT_SIG_ALGORITHM, object);
  }

  async setPublicKey(publicKey: PublicSignatureKey) {
    await this.addSection(SECTIONS.ACCOUNT_PUBLIC_KEY, {
      publicKey: publicKey.getPublicKeyAsBytes()
    });
  }

  async setTokenIssuance(object: any) {
    await this.addSection(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, object);
  }

  async setCreation(object: any) {
    await this.addSection(SECTIONS.ACCOUNT_CREATION, object);
  }

  async setTransfer(object: any) {
    await this.addSection(SECTIONS.ACCOUNT_TRANSFER, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async setSignature(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.ACCOUNT_SIGNATURE, object);
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async publicKeyCallback(microblock: any, section: any) {
    this.state.publicKeyHeight = microblock.header.height;
  }

  async tokenIssuanceCallback(microblock: any, section: any) {
    if(section.object.amount != ECO.INITIAL_OFFER) {
      throw `the amount of the initial token issuance is not the expected one`;
    }
  }

  async creationCallback(microblock: any, section: any) {
  }

  async transferCallback(microblock: any, section: any) {
    const payeeVb = new AccountVb({ provider: this.provider });
    await payeeVb.load(section.object.account);
  }

  async signatureCallback(microblock: any, section: any) {
  }

  /**
    Structure check
  */
  checkStructure(microblock: any) {
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
