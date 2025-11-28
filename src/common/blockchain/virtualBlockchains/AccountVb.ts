import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {IllegalStateError, SectionNotFoundError} from "../../errors/carmentis-error";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {AccountMicroblockStructureChecker} from "../structureCheckers/AccountMicroblockStructureChecker";
import {Microblock} from "../microblock/Microblock";
import {INITIAL_OFFER} from "../../constants/economics";
import {CMTSToken} from "../../economics/currencies/token";
import {IProvider} from "../../providers/IProvider";
import {AccountInternalState} from "../internalStates/AccountInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";

export class AccountVb extends VirtualBlockchain<AccountInternalState> {

    constructor(provider: IProvider, state: AccountInternalState = AccountInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN, state );
    }

    protected async updateLocalState(state: AccountInternalState, microblock: Microblock): Promise<AccountInternalState> {
        const localStateUpdater = InternalStateUpdaterFactory.createAccountInternalStateUpdater(
            microblock.getLocalStateUpdateVersion()
        );
        return localStateUpdater.updateState(state, microblock);
    }

    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new AccountMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
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
        const publicKeyDeclarationHeight = this.internalState.getPublicKeyHeight();
        const schemeId = this.internalState.getPublicKeySchemeId();
        const mb = await this.getMicroblock(publicKeyDeclarationHeight);
        const section = mb.getAccountPublicKeySection();
        const factory = new CryptoSchemeFactory();
        return factory.createPublicSignatureKey(schemeId, section.object.publicKey);
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
            publicKey: await accountOwnerPublicKey.getPublicKeyAsBytes()
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
            publicKey: await publicKey.getPublicKeyAsBytes()
        });
        microblock.addAccountTokenIssuanceSection({
            amount: INITIAL_OFFER
        })
        return microblock;
    }

    static async sealMicroblockUsingPrivateSignatureKey(microblock: Microblock, privateSignatureKey: PrivateSignatureKey) {
        const signature = await microblock.sign(privateSignatureKey, true);
        microblock.addAccountSignatureSection({ signature });
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
