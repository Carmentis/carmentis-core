import {AccountCreationInformation, AppDescription, OrgDescription} from "../entities/MicroBlock";
import {CMTSToken} from "../economics/currencies/token";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {Hash} from "../entities/Hash";

/**
 * Interface for interacting with the blockchain facade, providing methods for accessing
 * application, organization, account, and blockchain-related information.
 */
export interface BlockchainFacadeInterface {
    /**
     * Retrieves the description of the application associated with the provided application ID.
     *
     * @param {Hash} applicationId - The unique identifier of the application whose description is to be fetched.
     * @return {Promise<AppDescription>} A promise that resolves with the application's description.
     */
    getApplicationDescription(applicationId: Hash): Promise<AppDescription>;

    /**
     * Retrieves the description of a specified organisation based on the provided organisation ID.
     *
     * @param {Hash} organisationId - The unique identifier of the organisation whose description is to be retrieved.
     * @return {Promise<OrgDescription>} A promise that resolves to the description of the organisation.
     */
    getOrganisationDescription(organisationId: Hash): Promise<OrgDescription>;

    /**
     * Retrieves the unique identifier of the organization that owns a specific application.
     *
     * @param {Hash} applicationId - The unique identifier of the application.
     * @return {Promise<Hash>} A promise that resolves to the unique identifier of the owning organization.
     */
    getIdOfOrganisationOwningApplication(applicationId: Hash): Promise<Hash>;

    /**
     * Retrieves the account balance for a given account hash.
     *
     * @param {Hash} accountHash - The unique identifier representing the account whose balance is to be fetched.
     * @return {Promise<CMTSToken>} A promise that resolves to the account's balance as a CMTSToken object.
     */
    getAccountBalance(accountHash: Hash): Promise<CMTSToken>;

    /**
     * Retrieves the public key associated with the specified account hash.
     *
     * @param {Hash} accountHash - The unique identifier for the account whose public key is to be retrieved.
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the public signature key corresponding to the specified account.
     */
    getPublicKeyOfAccount(accountHash: Hash): Promise<PublicSignatureKey>;

    /**
     * Fetches the public signature key of a specified organisation.
     *
     * @param {Hash} organisationId - The unique identifier of the organisation for which the public key is being retrieved.
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the public signature key of the organisation.
     */
    getPublicKeyOfOrganisation(organisationId: Hash): Promise<PublicSignatureKey>;

    /**
     * Retrieves the public signature key of the issuer.
     *
     * @return {Promise<PublicSignatureKey>} A promise that resolves to the public signature key of the issuer.
     */
    getPublicKeyOfIssuer(): Promise<PublicSignatureKey>;


    /**
     * Retrieves the account history for the given account hash.
     *
     * @param {Hash} accountHash - The unique hash identifying the account.
     * @return {Promise<AccountHistoryView>} A promise that resolves with the account history view containing historical transaction or account-related information.
     */
    getAccountHistory(accountHash: Hash): Promise<AccountHistoryView>;

    /**
     * Retrieves a record associated with the given identifier and height, optionally using a private key for authentication.
     *
     * @param {Hash} vbId - The unique identifier for the record.
     * @param {number} height - The height or version of the record to retrieve.
     * @param {PrivateSignatureKey} [privateKey] - An optional private key used for authentication.
     * @return {Promise<T>} A promise that resolves to the retrieved record of the specified type.
     */
    getRecord<T = any>(vbId: Hash, height: number, privateKey?: PrivateSignatureKey): Promise<T>;


    /*
    getMicroBlock(microBlockHash: Hash): Promise<Microblock>;
    getManyMicroblocks(microBlockHashes: Hash[]): Promise<Microblock>;
     */
}