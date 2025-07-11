import {CacheBlockchainReader} from "./CacheBlockchainReader";
import {ABCINodeBlockchainReader} from "./ABCINodeBlockchainReader";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {ABCINodeBlockchainWriter} from "./ABCINodeBlockchainWriter";
import {IllegalParameterError, NotImplementedError, IllegalUsageError} from "../errors/carmentis-error";
import {Hash} from "../blockchain/types";
import {AccountCreation, AppDescription, OrgDescription} from "../entities/MicroBlock";
import {
    AccountVirtualBlockchainView,
    ApplicationVirtualBlockchainView,
    OrganisationVirtualBlockchainView
} from "../entities/VirtualBlockchainView";
import {CMTSToken} from "../economics/currencies/token";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {BytesSignatureEncoder} from "../crypto/signature/signature-encoder";
import {AppLedgerVirtualBlockchainView} from "../entities/AppLedgerVirtualBlockchainView";
import {IntermediateRepresentation} from "../records/intermediateRepresentation";
import {BlockchainReader, BlockchainWriter} from "./provider";
import {BlockchainFacadeInterface} from "./BlockchainFacadeInterface";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";

/**
 * The BlockchainFacade class provides a high-level interface for interacting with a blockchain.
 * It encapsulates several functionalities such as retrieving application and organization descriptions,
 * managing accounts, and handling keys.
 *
 * Implements the BlockchainFacadeInterface.
 */
export class BlockchainFacade implements BlockchainFacadeInterface {

    private writer?: BlockchainWriter;

    constructor(private reader: BlockchainReader) {
    }

    /**
     * Creates an instance of BlockchainFacade using the provided node URL.
     *
     * @param {string} nodeUrl - The URL of the blockchain node to connect to.
     * @return {BlockchainFacade} An instance of BlockchainFacade configured with the specified node URL.
     */
    static createFromNodeUrl(nodeUrl: string): BlockchainFacade {
        const reader = CacheBlockchainReader.createFromBlockchainReader(
            ABCINodeBlockchainReader.createFromNodeURL(nodeUrl)
        );
        return new BlockchainFacade(reader);
    }

    /**
     * Configures the private key for the blockchain writer.
     *
     * @param {PrivateSignatureKey} privateKey - The private signature key to be used for configuring the blockchain writer.
     * @return {void} This method does not return any value.
     */
    configurePrivateKey(privateKey: PrivateSignatureKey) {
        this.writer = new ABCINodeBlockchainWriter();
    }

    private getBlockchainWriter(): BlockchainWriter {
        if (!this.writer) {
            throw new IllegalUsageError("No blockchain writer configured. Call configurePrivateKey() first.")
        }
        return this.writer;
    }


    async getApplicationDescription(applicationId: Hash): Promise<AppDescription> {
        const view = await this.reader.getFirstMicroBlockInVirtualBlockchain<ApplicationVirtualBlockchainView>(applicationId);
        const microblock = view.getFirstMicroBlock()
        return microblock.getDescription();
    }

    async getOrganisationDescription(organisationIc: Hash): Promise<OrgDescription> {
        const view = await this.reader.getFirstMicroBlockInVirtualBlockchain<OrganisationVirtualBlockchainView>(organisationIc);
        const microblock = view.getFirstMicroBlock()
        return microblock.getDescription();
    }

    getAccountBalance(accountHash: Hash): Promise<CMTSToken> {
        return this.reader.getBalanceOfAccount(accountHash)
    }

    async getAccountCreationInformation(accountHash: Hash): Promise<AccountCreation> {
        const view = await this.reader.getFirstMicroBlockInVirtualBlockchain<AccountVirtualBlockchainView>(accountHash);
        const microblock = view.getFirstMicroBlock();
        return microblock.getAccountCreation();
    }

    getAccountHistory(accountHash: Hash): Promise<AccountHistoryView> {
        return this.reader.getAccountHistory(accountHash);
    }

    async getIdOfOrganisationOwningApplication(applicationId: Hash): Promise<Hash> {
        const view = await this.reader.getFirstMicroBlockInVirtualBlockchain<ApplicationVirtualBlockchainView>(applicationId);
        const microblock = view.getFirstMicroBlock();
        return microblock.getDeclarationOrgId();
    }

    /**
     * Retrieves the public key associated with a given account hash.
     *
     * Note that this function *should not* be used for the issuer.
     *
     * @param {Hash} accountHash - The hash of the account from which the public key will be retrieved.
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the public key of the given account.
     */
    async getPublicKeyOfAccount(accountHash: Hash): Promise<PublicSignatureKey> {
        const accountState = await this.reader.getAccountState(accountHash);
        const lastPublicKeyDeclarationState = accountState.getLastPublicKeyDeclarationHeight();
        const view = await this.reader.getVirtualBlockchainView<AccountVirtualBlockchainView>(accountHash, [lastPublicKeyDeclarationState]);
        const microblock = view.getMicroBlockAtHeigh(lastPublicKeyDeclarationState);
        const signatureEncoder = new BytesSignatureEncoder();
        return signatureEncoder.decodePublicKey(microblock.getPublicKey());
    }


    /**
     * Retrieves the public signature key of the issuer.
     *
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the public signature key of the issuer.
     */
    getPublicKeyOfIssuer(): Promise<PublicSignatureKey> {
        throw new NotImplementedError();
    }

    async getPublicKeyOfOrganisation(organisationId: Hash): Promise<PublicSignatureKey> {
        const view = await this.reader.getFirstMicroBlockInVirtualBlockchain<OrganisationVirtualBlockchainView>(organisationId)
        const microblock = view.getFirstMicroBlock();
        return microblock.getPublicKey();
    }

    async getRecord<T = any>(vbId: Hash, height: number, privateKey?: PrivateSignatureKey): Promise<T> {
        const vb = await this.reader.getVirtualBlockchainView<AppLedgerVirtualBlockchainView>(vbId, [height]);
        if (vb.getType() !== VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN) throw new IllegalParameterError("Attempting to obtain record from non-app-ledger virtual blockchain");
        const i = new IntermediateRepresentation();
        // TODO
        throw new NotImplementedError();
    }
}