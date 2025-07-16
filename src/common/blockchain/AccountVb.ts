import {CHAIN, ECO, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {StructureChecker} from "./StructureChecker";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {AccountTokenIssuance, AccountTransfer, AccountVBState} from "./types";
import {CryptoSchemeFactory} from "../crypto/factory";
import {Provider} from "../providers/Provider";

export class AccountVb extends VirtualBlockchain<AccountVBState> {
  constructor({provider}: { provider: Provider }) {
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
  async setSignatureAlgorithm(object: { algorithmId: SignatureAlgorithmId }) {
    await this.addSection(SECTIONS.ACCOUNT_SIG_ALGORITHM, object);
  }

  async setPublicKey(publicKey: PublicSignatureKey) {
    await this.addSection(SECTIONS.ACCOUNT_PUBLIC_KEY, {
      publicKey: publicKey.getPublicKeyAsBytes()
    });
  }

  async setTokenIssuance(object: AccountTokenIssuance) {
    await this.addSection(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, object);
  }

  async setCreation(object: any) {
    await this.addSection(SECTIONS.ACCOUNT_CREATION, object);
  }

  async setTransfer(object: AccountTransfer) {
    await this.addSection(SECTIONS.ACCOUNT_TRANSFER, object);
  }

  /**
   * Retrieves the public key from the current state.
   *
   * This method fetches the microblock corresponding to the public key height in the state,
   * extracts the section containing the public key, and returns the public key as a Uint8Array.
   *
   * @return {Promise<Uint8Array>} A promise resolving to the public key.
   */
  async getPublicKey() {
    const keyMicroblock = await this.getMicroblock(this.getState().publicKeyHeight);
    const keySection = keyMicroblock.getSection<{publicKey: Uint8Array}>((section: any) => section.type == SECTIONS.ACCOUNT_PUBLIC_KEY);
    return keySection.object.publicKey;
  }

  /**
   * Retrieves the signature algorithm ID from the relevant section of the microblock.
   *
   * @return {Promise<SignatureAlgorithmId>} A promise that resolves to the signature algorithm ID.
   */
  async getSignatureAlgorithmId(): Promise<SignatureAlgorithmId> {
    const keyMicroblock = await this.getFirstMicroBlock();
    const keySection = keyMicroblock.getSection<{algorithmId: number}>((section: any) => section.type == SECTIONS.ACCOUNT_SIG_ALGORITHM);
    return keySection.object.algorithmId as SignatureAlgorithmId;
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
    this.getState().signatureAlgorithmId = section.object.algorithmId;
  }

  async publicKeyCallback(microblock: any, section: any) {
    this.getState().publicKeyHeight = microblock.header.height;
  }

  async tokenIssuanceCallback(microblock: any, section: any) {
    if(section.object.amount != ECO.INITIAL_OFFER) {
      throw `the amount of the initial token issuance is not the expected one`;
    }
  }

  async creationCallback(microblock: any, section: any) {
    microblock.setFeesPayerAccount(section.object.sellerAccount);
  }

  async transferCallback(microblock: any, section: any) {
    const payeeVb = new AccountVb({ provider: this.provider });
    await payeeVb.load(section.object.account);
    microblock.setFeesPayerAccount(this.identifier);
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

  private static UNDEFINED_SIGNATURE_ALGORITHM_ID = -1;
  private static UNDEFINED_PUBLIC_KEY_HEIGHT = -1;

  getInitialState(): AccountVBState {
    return {
      signatureAlgorithmId: AccountVb.UNDEFINED_SIGNATURE_ALGORITHM_ID,
      publicKeyHeight: AccountVb.UNDEFINED_PUBLIC_KEY_HEIGHT
    }
  }
}
