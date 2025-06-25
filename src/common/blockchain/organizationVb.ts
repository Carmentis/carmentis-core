import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";
import {CryptoSchemeFactory} from "../crypto/factory";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../crypto/signature/signature-encoder";

export class OrganizationVb extends VirtualBlockchain {
  private signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
  constructor({
    provider
  }: any) {
    super({ provider, type: CHAIN.VB_ORGANIZATION });

    this.registerSectionCallback(SECTIONS.ORG_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.ORG_PUBLIC_KEY, this.publicKeyCallback);
    this.registerSectionCallback(SECTIONS.ORG_DESCRIPTION, this.descriptionCallback);
    this.registerSectionCallback(SECTIONS.ORG_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(signatureAlgorithmId: SignatureAlgorithmId) {
    await this.addSection(SECTIONS.ORG_SIG_ALGORITHM, {
      algorithmId: signatureAlgorithmId
    });
  }

  async setPublicKey(publicKey: PublicSignatureKey) {
    await this.addSection(SECTIONS.ORG_PUBLIC_KEY, {
      publicKey: publicKey.getPublicKeyAsBytes()
    });
  }

  async setDescription(object: any) {
    await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async setSignature(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.ORG_SIGNATURE, object);
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

  async descriptionCallback(microblock: any, section: any) {
    this.state.descriptionHeight = microblock.header.height;
  }

  async signatureCallback(microblock: any, section: any) {
    const keyMicroblock = await this.getMicroblock(this.state.publicKeyHeight);
    const rawPublicKey = keyMicroblock.getSection((section: any) => section.type == SECTIONS.ORG_PUBLIC_KEY).object.publicKey;
    const cryptoFactory = new CryptoSchemeFactory();
    const signatureAlgorithmId = this.state.signatureAlgorithmId;
    const publicKey = cryptoFactory.createPublicSignatureKey(signatureAlgorithmId, rawPublicKey)

    const valid = microblock.verifySignature(
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
  checkStructure(microblock: any) {
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
