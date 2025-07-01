import {CHAIN} from "../constants/constants";
import {Utils} from "../utils/utils";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Provider, ProviderInterface} from "../providers/provider";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptoSchemeFactory} from "../crypto/factory";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {AccountHash, Hash} from "./types";


export class Explorer {
  provider: Provider;
  constructor({
    provider
  }: {provider: Provider}) {
    this.provider = provider;
  }

  static createFromProvider(provider: Provider): Explorer {
    return new Explorer({provider});
  }

  /**
   * Retrieves information about a specific microblock by its hash.
   *
   * @param {Hash} hash The hash of the microblock in hexadecimal string format.
   * @return {Promise<any>} A promise that resolves to the information related to the specified microblock.
   */
  async getMicroblockInformation(hash: Hash) {
    return await this.provider.getMicroblockInformation(hash.toBytes());
  }

  async getMicroblockBodys(hashes: any) {
    return await this.provider.getMicroblockBodys(hashes);
  }

  /**
   * Retrieves the virtual blockchain state for the given identifier.
   *
   * @param {Hash} identifier - A string representing the identifier used to fetch the virtual blockchain state.
   * @return {Promise<Object>} A promise that resolves to the decoded virtual blockchain state object.
   */
  async getVirtualBlockchainState(identifier: Hash) {
    const { stateData } = await this.provider.getVirtualBlockchainStateExternal(identifier.toBytes());
    return BlockchainUtils.decodeVirtualBlockchainState(stateData);
  }

  /**
   * Retrieves the state of an account based on the provided account hash string.
   *
   * @param {Hash} accountHashString - The account hash in hexadecimal string format.
   * @return {Promise<any>} A promise that resolves to the account state associated with the given account hash.
   */
  async getAccountState(accountHashString: Hash) {
    return await this.provider.getAccountState(accountHashString.toBytes());
  }

  /**
   * Retrieves the account history for a specific account.
   *
   * @param {Hash} accountHash - The hash of the account for which the history is being retrieved.
   * @param {Hash} lastHistoryHashString - The hash of the last history record to start retrieving from.
   * @param {number} maxRecords - The maximum number of records to retrieve.
   * @return {Promise<AccountHistory>} A promise that resolves with the account history data.
   */
  async getAccountHistory(accountHash: Hash, lastHistoryHashString: Hash, maxRecords: number) {
    return await this.provider.getAccountHistory(
      accountHash.toBytes(),
      lastHistoryHashString.toBytes(),
      maxRecords
    );
  }

  /**
   * Retrieves an account hash associated with the given public key hash.
   *
   * @param {Hash} publicKeyHash - The hash of the public key to look up the account for.
   * @return {Promise<Hash>} A promise that resolves to the account hash corresponding to the given public key hash.
   */
  async getAccountByPublicKeyHash(publicKeyHash: Hash ): Promise<Hash> {
    const accountHash: AccountHash = await this.provider.getAccountByPublicKeyHash(publicKeyHash.toBytes());
    return Hash.from(accountHash.accountHash);
  }

  /**
   * Retrieves the account hash for a given public key.
   *
   * @param {PublicSignatureKey} publicKey - The public signature key associated with the account*/
  async getAccountByPublicKey(
      publicKey: PublicSignatureKey,
      hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()
  ): Promise<Hash> {
    const accountHash : AccountHash = await this.provider.getAccountByPublicKey(publicKey, hashScheme);
    return Hash.from(accountHash.accountHash);
  }

  /**
   * These methods are used to retrieve a list of VB identifiers, given an object type.
   */
  async getAccounts() {
    return await this.provider.getObjectList(CHAIN.VB_ACCOUNT);
  }
  async getValidatorNodes() {
    return await this.provider.getObjectList(CHAIN.VB_VALIDATOR_NODE);
  }
  async getOrganizations() {
    return await this.provider.getObjectList(CHAIN.VB_ORGANIZATION);
  }
  async getApplications() {
    return await this.provider.getObjectList(CHAIN.VB_APPLICATION);
  }
}
