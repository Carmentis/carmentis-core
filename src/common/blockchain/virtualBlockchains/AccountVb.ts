import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {AccountVBState} from "../../type/types";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {IllegalStateError, SectionNotFoundError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/SectionType";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {AccountMicroblockStructureChecker} from "../structureCheckers/AccountMicroblockStructureChecker";
import {AccountLocalState} from "../localStates/AccountLocalState";
import { Microblock } from "../microblock/Microblock";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {INITIAL_OFFER} from "../../constants/economics";
import {CMTSToken} from "../../economics/currencies/token";

export class AccountVb extends VirtualBlockchain {


    constructor(provider: Provider, private state: AccountLocalState = AccountLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN, new AccountMicroblockStructureChecker());
    }

    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const localStateUpdater = LocalStateUpdaterFactory.createAccountLocalStateUpdater(
            microblock.getLocalStateUpdateVersion()
        );
        this.state = await localStateUpdater.updateState(this.state, microblock);
    }

    /**
     * Retrieves the public key for the current instance of the cryptographic context.
     *
     * The method fetches the raw public key and the signature scheme ID, then utilizes the CryptoSchemeFactory
     * to create and return a public signature key object.
     *
     * @return {Promise<PublicSignatureKey>} A promise that resolves to a public signature key object.
     */
    async getPublicKey() {
        const publicKeyDeclarationHeight = this.state.getPublicKeyHeight();
        const schemeId = this.state.getPublicKeySchemeId();
        const mb = await this.getMicroblock(publicKeyDeclarationHeight);
        const section = mb.getAccountPublicKeySection();
        const factory = new CryptoSchemeFactory();
        return factory.createPublicSignatureKey(schemeId, section.object.publicKey);
    }

    private getSignatureSchemeId() {
        if (this.provider.isKeyed()) {
            return this.getPrivateSignatureKey().getSignatureSchemeId();
        } else {
            throw new IllegalStateError("Cannot get signature scheme ID without a keyed provider.")
        }
    }

    private getPrivateSignatureKey() {
        if (this.provider.isKeyed()) {
            return this.provider.getPrivateSignatureKey();
        } else {
            throw new IllegalStateError("Cannot get private signature key without a keyed provider.")
        }
    }

    async isIssuer() {
        try {
            const firstBlock = await this.getFirstMicroBlock();
            firstBlock.getAccountTokenIssuanceSection();
        } catch (e: SectionNotFoundError | unknown) {
            if (e instanceof SectionNotFoundError) return false;
            else throw e;
        }
    }

    static async createAccountCreationMicroblock(accountOwnerPublicKey: PublicSignatureKey, initialAmount: CMTSToken, sellerAccountId: Uint8Array, accountName: string = '') {
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addAccountSignatureSchemeSection({
            schemeId: accountOwnerPublicKey.getSignatureSchemeId()
        });
        mb.addAccountPublicKeySection({
            publicKey: accountOwnerPublicKey.getPublicKeyAsBytes()
        });
        mb.addAccountCreationSection({
            amount: initialAmount.getAmountAsAtomic(),
            sellerAccount: sellerAccountId
        });
        return mb;
    }

    static async createIssuerAccountCreationMicroblock(genesisPublicKey: PublicSignatureKey): Promise<Microblock> {
        /*
         // we need a public key to create the genesis account, so we raise an exception if
        // both the provider and the default public key are undefined
        const isUnkeyed = !this.provider.isKeyed();
        const undefinedGenesisPublicKey = genesisPublicKey === undefined;
        if (isUnkeyed && undefinedGenesisPublicKey) {
            throw new IllegalStateError("Cannot create a genesis account without a keyed provider or default public key.")
        }

        // we use in priority the default public key, if provided, or the keyed provider's public key
        const publicKey = genesisPublicKey || this.getPrivateSignatureKey().getPublicKey();
         */

        // we use in priority the default public key, if provided, or the keyed provider's public key
        const publicKey = genesisPublicKey;
        const microblock = Microblock.createGenesisAccountMicroblock();
        microblock.addAccountSignatureSchemeSection({
            schemeId: publicKey.getSignatureSchemeId()
        });
        microblock.addAccountPublicKeySection({
            publicKey: publicKey.getPublicKeyAsBytes()
        });
        microblock.addAccountTokenIssuanceSection({
            amount: INITIAL_OFFER
        })
        return microblock;
    }



    /**
     Update methods
     */

    /*
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

     async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.ACCOUNT_SIGNATURE, object);
    }

     */





}
