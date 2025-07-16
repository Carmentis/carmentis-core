import {ABCINodeBlockchainReader} from "./ABCINodeBlockchainReader";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {ABCINodeBlockchainWriter} from "./ABCINodeBlockchainWriter";
import {IllegalUsageError, NotImplementedError} from "../errors/carmentis-error";
import {AccountCreationInformation, AppDescription, OrgDescription} from "../entities/MicroBlock";
import {CMTSToken} from "../economics/currencies/token";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {BlockchainFacadeInterface} from "./BlockchainFacadeInterface";
import {Hash} from "../entities/Hash";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {BlockchainReader} from "./BlockchainReader";
import {Application} from "../blockchain/Application";
import {Organization} from "../blockchain/Organization";
import {BlockchainWriter} from "./BlockchainWriter";
import {PublicationExecutionContext} from "./publicationContexts/PublicationExecutionContext";
import {OrganisationPublicationExecutionContext} from "./publicationContexts/OrganisationPublicationExecutionContext";
import {AccountPublicationExecutionContext} from "./publicationContexts/AccountPublicationExecutionContext";
import {ApplicationPublicationExecutionContext} from "./publicationContexts/ApplicationPublicationExecutionContext";

import {RecordDescription} from "../blockchain/RecordDescription";
import {RecordPublicationExecutionContext} from "./publicationContexts/RecordPublicationExecutionContext";
import {ProofBuilder} from "../entities/ProofBuilder";
import {Utils} from "../utils/utils";
import {Proof} from "../blockchain/types";
import {
    AccountTransferPublicationExecutionContext
} from "./publicationContexts/AccountTransferPublicationExecutionContext";
import {Height} from "../entities/Height";
import {AccountState} from "../entities/AccountState";

/**
 * The BlockchainFacade class provides a high-level interface for interacting with a blockchain.
 * It encapsulates several functionalities such as retrieving application and organization descriptions,
 * managing accounts, and handling keys.
 *
 * Implements the BlockchainFacadeInterface.
 */
export class BlockchainFacade implements BlockchainFacadeInterface {

    constructor(private nodeUrl: string, private reader: BlockchainReader, private writer?: BlockchainWriter) {}

    /**
     * Creates an instance of BlockchainFacade using the provided node URL.
     *
     * @param {string} nodeUrl - The URL of the blockchain node to connect to.
     * @return {BlockchainFacade} An instance of BlockchainFacade configured with the specified node URL.
     */
    static createFromNodeUrl(nodeUrl: string): BlockchainFacade {
        const reader = ABCINodeBlockchainReader.createFromNodeURL(nodeUrl);
        return new BlockchainFacade(nodeUrl, reader);
    }

    /**
     * Creates an instance of BlockchainFacade using the provided node URL and private signature key.
     *
     * @param {string} nodeUrl - The URL of the blockchain node to connect to.
     * @param {PrivateSignatureKey} privateKey - The private signature key for authentication and signing transactions.
     * @return {BlockchainFacade} A new instance of BlockchainFacade configured with the given node URL and private key.
     */
    static createFromNodeUrlAndPrivateKey(nodeUrl: string, privateKey: PrivateSignatureKey): BlockchainFacade {
        const reader = ABCINodeBlockchainReader.createFromNodeURL(nodeUrl);
        const writer = ABCINodeBlockchainWriter.createWriter(reader, nodeUrl, privateKey);
        return new BlockchainFacade(nodeUrl, reader, writer);
    }



    private getBlockchainWriter(): BlockchainWriter {
        if (!this.writer) {
            throw new IllegalUsageError("No blockchain writer configured. Call configurePrivateKey() first.")
        }
        return this.writer;
    }


    async getApplicationDescription(applicationId: Hash): Promise<AppDescription> {
        const description = await this.reader.getApplicationDescription(applicationId);
        return new class extends AppDescription {
            getDescription(): string {
                return description.description;
            }

            getHomepageUrl(): string {
                return description.homepageUrl;
            }

            getLogoUrl(): string {
                return description.logoUrl;
            }

            getName(): string {
                return description.name;
            }
        };
    }

    async getOrganisationDescription(organisationId: Hash): Promise<OrgDescription> {
        const description = await this.reader.getOrganisationDescription(organisationId);
        return new class extends OrgDescription {
            getCity(): string {
                return description.city;
            }

            getCountryCode(): string {
                return description.countryCode;
            }

            getName(): string {
                return description.name;
            }

            getWebsite(): string {
                return description.website;
            }
        }
    }

    getAccountBalance(accountHash: Hash): Promise<CMTSToken> {
        return this.reader.getBalanceOfAccount(accountHash)
    }

    getAccountHistory(accountHash: Hash): Promise<AccountHistoryView> {
        return this.reader.getAccountHistory(accountHash);
    }

    async getIdOfOrganisationOwningApplication(applicationId: Hash): Promise<Hash> {
        const application = await this.reader.loadApplication(applicationId);
        return await application.getOrganizationId();
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
        const account = await this.reader.loadAccount(accountHash);
        return account.getPublicKey();
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
        return await this.reader.getPublicKeyOfOrganisation(organisationId);
    }

    /**
     * Loads the application ledger associated with the given virtual block identifier (vbId).
     *
     * @param {Hash} vbId - The unique identifier of the virtual block whose application ledger is to be loaded.
     * @return {Promise<ApplicationLedger>} A promise that resolves to the application ledger associated with the provided vbId.
     */
    async loadApplicationLedger(vbId: Hash): Promise<ApplicationLedger> {
        return this.reader.loadApplicationLedger(vbId);
    }

    /**
     * Loads an application based on the provided identifier.
     *
     * @param {Hash} identifier - The unique identifier of the application to be loaded.
     * @return {Promise<Application>} A promise that resolves to the loaded application.
     */
    async loadApplication(identifier: Hash): Promise<Application> {
        return this.reader.loadApplication(identifier);
    }

    /**
     * Loads an organization based on the provided identifier.
     *
     * @param {Hash} identifierString - The unique identifier of the organization to be loaded.
     * @return {Promise<Organization>} A promise that resolves to the loaded organization.
     */
    async loadOrganization(identifierString: Hash): Promise<Organization> {
       return this.reader.loadOrganization(identifierString);
    }

    /**
     * Loads an account using the given identifier.
     *
     * @param {Hash} identifier - The unique identifier of the account to load.
     * @return {Promise<Account>} A promise that resolves to the loaded account object.
     */
    async loadAccount(identifier: Hash) {
        return this.reader.loadAccount(identifier);
    }

    /**
     * Creates a new genesis account and publishes its updates.
     *
     * Note: This method is only reserved to create genesis account. Once created, next calls throw an exception.
     *
     * @return {Promise<Account>} A promise that resolves to the location of the created genesis account.
     */
    async createAndPublishGenesisAccount(context: PublicationExecutionContext) {
        const genesisAccount = await this.getWriter().createGenesisAccount();
        genesisAccount.setGasPrice(context.getGasPrice())
        return await genesisAccount.publishUpdates();
    }

    /**
     * Creates an account based on the seller's account, buyer's public key, and initial amount,
     * then publishes updates to reflect the account changes.
     *
     * @param {AccountPublicationExecutionContext} context - The execution context containing the seller's account, buyer's public key, initial account amount, and gas price.
     * @return {Promise<Account>} A promise that resolves to the created and published account.
     */
    async createAndPublishAccount(context: AccountPublicationExecutionContext) {
        const writer = this.getWriter();
        const account = await writer.createAccount(
            context.getSellerAccount(),
            context.getBuyerPublicKey(),
            context.getInitialBuyerAccountAmount()
        );
        account.setGasPrice(context.getGasPrice())
        return await account.publishUpdates();
    }

    /**
     * Creates an organisation, configures it with the provided context, and publishes updates.
     *
     * @param {OrganisationPublicationExecutionContext} context - The context containing configuration and execution details for the organisation publication.
     * @return {Promise<Hash>} A promise that resolves to the location of the published organisation.
     */
    async createAndPublishOrganisation(context: OrganisationPublicationExecutionContext) {
        const writer = this.getWriter();
        const organisation = await writer.createOrganization();
        organisation.setGasPrice(context.getGasPrice());
        await organisation.setDescription(context.build())
       return  await organisation.publishUpdates();
    }

    /**
     * Creates and publishes an application based on the provided context.
     *
     * @param {ApplicationPublicationExecutionContext} context - The execution context containing the details necessary to create and publish the application, such as organisation information, application metadata, and gas price settings.
     * @return {Promise<Object>} A promise that resolves to the location of the created application.
     */
    async createAndPublishApplication(context: ApplicationPublicationExecutionContext) {
        const writer = this.getWriter();
        const data = context.build();
        const application = await writer.createApplication(data.organisationId);
        await application.setDescription({
            name: data.applicationName,
            logoUrl: data.logoUrl,
            homepageUrl: data.homepageUrl,
            description: data.applicationDescription
        });

        application.setGasPrice(context.getGasPrice());
        return await application.publishUpdates();
    }

    /**
     * Publishes a record using the provided execution context.
     *
     * @param {RecordPublicationExecutionContext<T>} context - The context containing the necessary data to build and publish the record.
     * @return {Promise<Hash>} A promise that resolves the hash of the published micro-block.
     */
    async publishRecord<T = any>(context: RecordPublicationExecutionContext<T>) {
        const writer = this.getWriter();
        const applicationLedger = await writer.createApplicationLedgerFromJson(context.build());
        applicationLedger.setGasPrice(context.getGasPrice());
        return await applicationLedger.publishUpdates();
    }

    async publishTokenTransfer(context: AccountTransferPublicationExecutionContext) {
        const writer = this.getWriter();
        const data = context.build();
        return writer.createTokenTransfer(
            data.sellerPrivateKey,
            data.buyerAccount,
            data.amount,
            data.publicReference,
            data.privateReference,
        );
    }

    async createProofBuilderForApplicationLedger(applicationLedgerId: Hash) {
        const appLedger = await this.loadApplicationLedger(applicationLedgerId);
        return ProofBuilder.createProofBuilder(applicationLedgerId, appLedger);
    }

    async verifyProofFromJson(proof: Proof) {
        return this.reader.verifyProofFromJson(proof);
    }

    async getRecord<T = any>(vbId: Hash, height: Height, privateKey?: PrivateSignatureKey): Promise<T> {
        return this.reader.getRecord(vbId, height, privateKey);
    }

    async getRecordAtFirstBlock<T = any>(vbId: Hash, privateKey?: PrivateSignatureKey): Promise<T> {
        return this.getRecord(vbId, 1, privateKey);
    }


    /**
     * Retrieves all accounts.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of account hashes.
     */
    async getAllAccounts(): Promise<Hash[]> {
        return this.reader.getAllAccounts();
    }

    /**
     * Retrieves a list of all organisations from the data source.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of organisation data represented as hashes.
     */
    async getAllOrganisations(): Promise<Hash[]> {
        return this.reader.getAllOrganisations();
    }

    /**
     * Retrieves all validator nodes.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of validator node hashes.
     */
    async getAllValidatorNodes(): Promise<Hash[]> {
        return this.reader.getAllValidatorNodes();
    }

    /**
     * Retrieves all applications from the data source.
     *
     * @return {Promise<Hash[]>} A promise that resolves with an array of Hash objects representing all applications.
     */
    async getAllApplications(): Promise<Hash[]> {
        return this.reader.getAllApplications();
    }

    /**
     * Retrieves the current state of the account associated with the provided account hash.
     *
     * @param {Hash} accountHash - The unique hash identifying the account whose state is to be retrieved.
     * @return {Promise<AccountState>} A promise that resolves to the state of the account associated with the given hash.
     */
    async getAccountState(accountHash: Hash): Promise<AccountState> {
        return this.reader.getAccountState(accountHash);
    }


    private getWriter(): BlockchainWriter {
        if (!this.writer) throw new IllegalUsageError("No blockchain writer configured. Call BlockchainFacade.createFromNodeUrlAndPrivateKey(...) instead.");
        return this.writer;
    }


}