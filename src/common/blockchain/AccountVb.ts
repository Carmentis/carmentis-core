import {CHAIN, ECO, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {StructureChecker} from "./StructureChecker";
import {PrivateSignatureKey, PublicSignatureKey, SignatureSchemeId} from "../crypto/signature/signature-interface";
import {AccountTokenIssuance, AccountTransfer, AccountVestingTransfer, AccountEscrowTransfer, AccountStake, AccountVBState} from "./types";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Provider} from "../providers/Provider";

export class AccountVb extends VirtualBlockchain<AccountVBState> {
  constructor({provider}: { provider: Provider }) {
    super({ provider, type: CHAIN.VB_ACCOUNT });

    this.registerSectionCallback(SECTIONS.ACCOUNT_SIG_SCHEME, this.signatureSchemeCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_PUBLIC_KEY, this.publicKeyCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_TOKEN_ISSUANCE, this.tokenIssuanceCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_CREATION, this.creationCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_TRANSFER, this.transferCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_VESTING_TRANSFER, this.vestingTransferCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_ESCROW_TRANSFER, this.escrowTransferCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_STAKE, this.stakeCallback);
    this.registerSectionCallback(SECTIONS.ACCOUNT_SIGNATURE, this.signatureCallback);
  }

  /**
    Update methods
  */
  async setSignatureScheme(object: { schemeId: SignatureSchemeId }) {
    await this.addSection(SECTIONS.ACCOUNT_SIG_SCHEME, object);
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

  async setVestingTransfer(object: AccountVestingTransfer) {
    await this.addSection(SECTIONS.ACCOUNT_VESTING_TRANSFER, object);
  }

  async setEscrowTransfer(object: AccountEscrowTransfer) {
    await this.addSection(SECTIONS.ACCOUNT_ESCROW_TRANSFER, object);
  }

  async setStake(object: AccountStake) {
    await this.addSection(SECTIONS.ACCOUNT_STAKE, object);
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
   * Retrieves the signature scheme ID from the relevant section of the microblock.
   *
   * @return {Promise<SignatureSchemeId>} A promise that resolves to the signature scheme ID.
   */
  async getSignatureSchemeId(): Promise<SignatureSchemeId> {
    const keyMicroblock = await this.getFirstMicroBlock();
    const keySection = keyMicroblock.getSection<{schemeId: number}>((section: any) => section.type == SECTIONS.ACCOUNT_SIG_SCHEME);
    return keySection.object.schemeId as SignatureSchemeId;
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
  async signatureSchemeCallback(microblock: any, section: any) {
    this.getState().signatureSchemeId = section.object.schemeId;
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

  async vestingTransferCallback(microblock: any, section: any) {
    // FIXME: to be completed
    const payeeVb = new AccountVb({ provider: this.provider });
    await payeeVb.load(section.object.account);
    microblock.setFeesPayerAccount(this.identifier);
  }

  async escrowTransferCallback(microblock: any, section: any) {
    // FIXME: to be completed
    const payeeVb = new AccountVb({ provider: this.provider });
    await payeeVb.load(section.object.account);
    microblock.setFeesPayerAccount(this.identifier);
  }

  async stakeCallback(microblock: any, section: any) {
    // TODO
  }

  async signatureCallback(microblock: any, section: any) {
    // TODO
  }

  /**
    Structure check
  */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);

    checker.expects(
      checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
      SECTIONS.ACCOUNT_SIG_SCHEME
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

  private static UNDEFINED_SIGNATURE_SCHEME_ID = -1;
  private static UNDEFINED_PUBLIC_KEY_HEIGHT = 0;

  getInitialState(): AccountVBState {
    return {
      signatureSchemeId: AccountVb.UNDEFINED_SIGNATURE_SCHEME_ID,
      publicKeyHeight: AccountVb.UNDEFINED_PUBLIC_KEY_HEIGHT
    }
  }
}
