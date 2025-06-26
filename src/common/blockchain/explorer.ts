import {Utils} from "../utils/utils";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Provider, ProviderInterface} from "../providers/provider";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptoSchemeFactory} from "../crypto/factory";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {AccountHash} from "./types";


export class Explorer implements ProviderInterface {
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
   * @param {string} hashString The hash of the microblock in hexadecimal string format.
   * @return {Promise<any>} A promise that resolves to the information related to the specified microblock.
   */
  async getMicroblockInformation(hashString: string) {
    return await this.provider.getMicroblockInformation(Utils.binaryFromHexa(hashString));
  }

  async getMicroblockBodys(hashes: any) {
    return await this.provider.getMicroblockBodys(hashes);
  }

  /**
   * Retrieves the virtual blockchain state for the given identifier.
   *
   * @param {string} identifierString - A string representing the identifier used to fetch the virtual blockchain state.
   * @return {Promise<Object>} A promise that resolves to the decoded virtual blockchain state object.
   */
  async getVirtualBlockchainState(identifierString: string) {
    const { stateData } = await this.provider.getVirtualBlockchainStateExternal(Utils.binaryFromHexa(identifierString));
    return BlockchainUtils.decodeVirtualBlockchainState(stateData);
  }

  /**
   * Retrieves the state of an account based on the provided account hash string.
   *
   * @param {string} accountHashString - The account hash in hexadecimal string format.
   * @return {Promise<any>} A promise that resolves to the account state associated with the given account hash.
   */
  async getAccountState(accountHashString: string) {
    return await this.provider.getAccountState(Utils.binaryFromHexa(accountHashString));
  }

  /**
   * Fetches the account history based on the provided account hash, last history hash, and maximum number of records.
   *
   * @param {string} accountHashString - The hexadecimal string representing the account hash.
   * @*/
  async getAccountHistory(accountHashString: string, lastHistoryHashString: string, maxRecords: number) {
    return await this.provider.getAccountHistory(
      Utils.binaryFromHexa(accountHashString),
      Utils.binaryFromHexa(lastHistoryHashString),
      maxRecords
    );
  }

  /**
   * Retrieves an account using the provided public key hash string.
   *
   * @param {string} publicKeyHashString - The public key hash as a hexadecimal string.
   * @return {Promise<AccountHash>} A promise that resolves to the account hash associated with the given public key hash.
   */
  async getAccountByPublicKeyHash(publicKeyHashString: string): Promise<AccountHash> {
    return await this.provider.getAccountByPublicKeyHash(Utils.binaryFromHexa(publicKeyHashString));
  }

  /**
   * Retrieves the account hash associated with a given public key.
   *
   * @param {PublicSignatureKey} publicKey - The public key to retrieve the associated account hash for.
   * @param {CryptographicHash} [hashScheme] - The cryptographic hash scheme to use. By default, it uses the scheme created by `CryptoSchemeFactory.createDefaultCryptographicHash()`.
   * @return {Promise<AccountHash>} A promise that resolves to the account hash associated with the provided public key.
   */
  async getAccountByPublicKey(
      publicKey: PublicSignatureKey,
      hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()
  ): Promise<AccountHash> {
    return  await this.provider.getAccountByPublicKey(publicKey, hashScheme);
  }
}
