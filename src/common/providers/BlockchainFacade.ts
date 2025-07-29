import {ABCINodeBlockchainReader} from "./ABCINodeBlockchainReader";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {ABCINodeBlockchainWriter} from "./ABCINodeBlockchainWriter";
import {IllegalUsageError, NotImplementedError} from "../errors/carmentis-error";
import {CMTSToken} from "../economics/currencies/token";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {Hash} from "../entities/Hash";
import {BlockchainReader} from "./BlockchainReader";
import {BlockchainWriter} from "./BlockchainWriter";
import {PublicationExecutionContext} from "./publicationContexts/PublicationExecutionContext";
import {OrganizationPublicationExecutionContext} from "./publicationContexts/OrganizationPublicationExecutionContext";
import {AccountPublicationExecutionContext} from "./publicationContexts/AccountPublicationExecutionContext";
import {ValidatorNodePublicationExecutionContext} from "./publicationContexts/ValidatorNodePublicationExecutionContext";
import {ApplicationPublicationExecutionContext} from "./publicationContexts/ApplicationPublicationExecutionContext";
import {RecordPublicationExecutionContext} from "./publicationContexts/RecordPublicationExecutionContext";
import {ProofBuilder} from "../entities/ProofBuilder";
import {Proof} from "../blockchain/types";
import {
    AccountTransferPublicationExecutionContext
} from "./publicationContexts/AccountTransferPublicationExecutionContext";
import {AccountState} from "../entities/AccountState";
import {OrganizationWrapper} from "../wrappers/OrganizationWrapper";
import {ValidatorNodeWrapper} from "../wrappers/ValidatorNodeWrapper";
import {ApplicationWrapper} from "../wrappers/ApplicationWrapper";
import {ApplicationLedgerWrapper} from "../wrappers/ApplicationLedgerWrapper";
import {AccountWrapper} from "../wrappers/AccountWrapper";

/**
 * The BlockchainFacade class provides a high-level interface for interacting with a blockchain.
 * It encapsulates several functionalities such as retrieving application and organization descriptions,
 * managing accounts, and handling keys.
 *
 * Implements the BlockchainFacadeInterface.
 */
export class BlockchainFacade{

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

    getAccountBalance(accountHash: Hash): Promise<CMTSToken> {
        return this.reader.getBalanceOfAccount(accountHash)
    }

    async getAccountBalanceFromPublicKey(publicKey: PublicSignatureKey): Promise<CMTSToken> {
        const accountHash = await this.getAccountHashFromPublicKey(publicKey);
        return this.getAccountBalance(accountHash)
    }

    getAccountHistory(accountHash: Hash): Promise<AccountHistoryView> {
        return this.reader.getAccountHistory(accountHash);
    }

    async getAccountHistoryFromPublicKey(publicKey: PublicSignatureKey) {
        const accountHash = await this.getAccountHashFromPublicKey(publicKey);
        return this.getAccountHistory(accountHash)
    }

    async getIdOfOrganizationOwningApplication(applicationId: Hash): Promise<Hash> {
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

    async getPublicKeyOfOrganization(organizationId: Hash): Promise<PublicSignatureKey> {
        const org = await this.reader.loadOrganization(organizationId);
        return org.getPublicKey();
    }

    /**
     * Retrieves the account hash associated with the provided public key.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key used to identify the account.
     * @return {Promise<Hash>} A promise that resolves to the hash of the account associated with the given public key.
     */
    async getAccountHashFromPublicKey(publicKey: PublicSignatureKey): Promise<Hash> {
        return this.reader.getAccountByPublicKey(publicKey)
    }

    /**
     * Loads a validator node based on the provided identifier.
     *
     * @param {Hash} identifier - The unique identifier of the validator node to be loaded.
     * @return {Promise<ValidatorNodeWrapper>} A promise that resolves to the loaded validator node.
     */
    async loadValidatorNode(identifier: Hash): Promise<ValidatorNodeWrapper> {
        const validatorNode = await this.reader.loadValidatorNode(identifier);
        return await ValidatorNodeWrapper.wrap(validatorNode);
    }

    /**
     * Loads the application ledger associated with the given virtual block identifier (vbId).
     *
     * @param {Hash} vbId - The unique identifier of the virtual block whose application ledger is to be loaded.
     * @return {Promise<ApplicationLedgerWrapper>} A promise that resolves to the application ledger associated with the provided vbId.
     */
    async loadApplicationLedger(vbId: Hash): Promise<ApplicationLedgerWrapper> {
        const appLedger = await this.reader.loadApplicationLedger(vbId);
        return ApplicationLedgerWrapper.wrap(appLedger)
    }

    /**
     * Loads an application based on the provided identifier.
     *
     * @param {Hash} identifier - The unique identifier of the application to be loaded.
     * @return {Promise<ApplicationWrapper>} A promise that resolves to the loaded application.
     */
    async loadApplication(identifier: Hash): Promise<ApplicationWrapper> {
        const application = await this.reader.loadApplication(identifier);
        return await ApplicationWrapper.wrap(application);
    }

    /**
     * Loads an organization based on the provided identifier.
     *
     * @param {Hash} organizationId - The unique identifier of the organization to be loaded.
     * @return {Promise<OrganizationWrapper>} A promise that resolves to the loaded organization.
     */
    async loadOrganization(organizationId: Hash): Promise<OrganizationWrapper> {
       const organization = await this.reader.loadOrganization(organizationId);
       return await OrganizationWrapper.wrap(organization);
    }

    /**
     * Loads an account using the given identifier.
     *
     * @param {Hash} identifier - The unique identifier of the account to load.
     * @return {Promise<AccountWrapper>} A promise that resolves to the loaded account object.
     */
    async loadAccount(identifier: Hash): Promise<AccountWrapper> {
        const account = await this.reader.loadAccount(identifier);
        return AccountWrapper.wrap(account);
    }

    /**
import {BlockchainFacadeInterface} from "./BlockchainFacadeInterface";
     * Creates a new genesis account and publishes its updates.
     *
     * Note: This method is only reserved to create genesis account. Once created, next calls throw an exception.
     *
     * @return {Promise<Hash>} A promise that resolves to the location of the created genesis account.
     */
    async publishGenesisAccount(context: PublicationExecutionContext) {
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
    async publishAccount(context: AccountPublicationExecutionContext) {
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
     * Publish an organization, configures it with the provided context, and publishes updates.
     *
     * @param {OrganizationPublicationExecutionContext} context - The context containing configuration and execution details for the organization publication.
     * @return {Promise<Hash>} A promise that resolves to the location of the published organization.
     */
    async publishOrganization(context: OrganizationPublicationExecutionContext) {
        const build = context.build();
        const focusOnExistingOrganization = build.existingOrganizationId.isSome();
        if (focusOnExistingOrganization) {
            return this.publishOrganizationUpdate(context);
        } else {
            return this.publishOrganizationCreation(context);
        }
    }

    async publishOrganizationCreation(context: OrganizationPublicationExecutionContext) {
        const writer = this.getWriter();
        const build = context.build();
        const organization = await writer.createOrganization();
        await organization.setDescription(build);
        organization.setGasPrice(context.getGasPrice());
        return  await organization.publishUpdates()
    }

    async publishOrganizationUpdate(context: OrganizationPublicationExecutionContext) {
        const build = context.build();
        const existingOrganizationId = build.existingOrganizationId
            .unwrapOrThrow(new IllegalUsageError("Cannot update organization: no organization id provided "));
        const writer = this.getWriter();
        const organization = await writer.loadOrganization(existingOrganizationId);
        const description = await organization.getDescription();
        await organization.setDescription({
            name: build.name || description.name,
            city: build.city || description.city,
            countryCode: build.city || description.countryCode,
            website: build.website || description.website,
        });
        organization.setGasPrice(context.getGasPrice());
        return await organization.publishUpdates();
    }

    /**
     * Creates and publishes an application based on the provided context.
     *
     * @param {ApplicationPublicationExecutionContext} context - The execution context containing the details necessary to create and publish the application, such as organization information, application metadata, and gas price settings.
     * @return {Promise<Hash>} A promise that resolves to the location of the created application.
     */
    async publishApplication(context: ApplicationPublicationExecutionContext) {
        const writer = this.getWriter();
        const data = context.build();
        const isUpdatingApplication = data.applicationId.isSome();
        let application;
        if (isUpdatingApplication) {
            application = await writer.loadApplication(data.applicationId.unwrap());
            const description = await application.getDescription();
            await application.setDescription({
                name: data.applicationName || description.name,
                logoUrl: data.logoUrl || description.logoUrl,
                homepageUrl: data.homepageUrl || description.homepageUrl,
                description: data.applicationDescription || description.description,
            });
        } else {
            const organizationId = data.organizationId.unwrapOrThrow(
                new IllegalUsageError("Organization ID is required for application publication.")
            );
            application = await writer.createApplication(organizationId);
            await application.setDescription({
                name: data.applicationName,
                logoUrl: data.logoUrl,
                homepageUrl: data.homepageUrl,
                description: data.applicationDescription
            });
        }
        application.setGasPrice(context.getGasPrice());
        return await application.publishUpdates();
    }

    /**
     * Creates and publishes a validator node based on the provided context.
     *
     * @param {ValidatorNodePublicationExecutionContext} context - The execution context containing the details necessary to create and publish the application, such as organization information, application metadata, and gas price settings.
     * @return {Promise<Hash>} A promise that resolves to the location of the created application.
     */
    async publishValidatorNode(context: ValidatorNodePublicationExecutionContext) {
        const writer = this.getWriter();
        const data = context.build();
        const isUpdatingValidatorNode = data.validatorNodeId.isSome();
        let validatorNode;
        if (isUpdatingValidatorNode) {
            validatorNode = await writer.loadValidatorNode(data.validatorNodeId.unwrap());
            const description = await validatorNode.getDescription();
            await validatorNode.setDescription({
                power: data.power || description.power,
                cometPublicKeyType: data.cometPublicKeyType || description.cometPublicKeyType,
                cometPublicKey: data.cometPublicKey || description.cometPublicKey,
            });
        } else {
            const organizationId = data.organizationId.unwrapOrThrow(
                new IllegalUsageError("Organization ID is required for validator node publication.")
            );
            validatorNode = await writer.createValidatorNode(organizationId);
            await validatorNode.setDescription({
                power: data.power,
                cometPublicKeyType: data.cometPublicKeyType,
                cometPublicKey: data.cometPublicKey
            });
        }
        validatorNode.setGasPrice(context.getGasPrice());
        return await validatorNode.publishUpdates();
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
        const buyerAccount = data.buyerAccount;
        const buyerAccountHash = buyerAccount instanceof Hash ? buyerAccount : await this.reader.getAccountByPublicKey(buyerAccount)
        return writer.createTokenTransfer(
            data.sellerPrivateKey,
            buyerAccountHash,
            data.amount,
            data.publicReference,
            data.privateReference,
        );
    }

    async createProofBuilderForApplicationLedger(applicationLedgerId: Hash) {
        const appLedger = await this.reader.loadApplicationLedger(applicationLedgerId);
        return ProofBuilder.createProofBuilder(applicationLedgerId, appLedger);
    }

    async verifyProofFromJson(proof: Proof) {
        return this.reader.verifyProofFromJson(proof);
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
     * Retrieves a list of all organizations from the data source.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of organization data represented as hashes.
     */
    async getAllOrganizations(): Promise<Hash[]> {
        return this.reader.getAllOrganizations();
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

    /**
     * Removes undefined entries.
     *
     * @param obj
     *
     * @private
     */
    private cleanObject<T extends Record<string, any>>(obj: T): Partial<T> {
        return Object.fromEntries(
            Object.entries(obj).filter(([_, v]) => v !== undefined)
        ) as Partial<T>;
    }
}