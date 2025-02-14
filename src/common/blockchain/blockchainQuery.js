import { ECO, SCHEMAS } from "../constants/constants.js";
import { schemaSerializer } from "../serializers/serializers.js";
import { blockchainCore } from "./blockchainCore.js";

export class blockchainQuery extends blockchainCore {
  /**
   * Retrieves the status of the blockchain.
   *
   * @return {Promise} A promise that resolves to an object matching the schema MSG_ANS_CHAIN_STATUS.
   */
  static async getChainStatus() {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_CHAIN_STATUS,
      {}
    );

    return answer;
  }

  /**
   * Retrieves the content of a microblock identified by its hash.
   *
   * @param {string} hash - The hash of the microblock to be retrieved.
   * @return {Promise} A promise that resolves with the binary content of the microblock.
   */
  static async getMicroblock(hash) {
    return await this.loadMicroblock(hash);
  }

  /**
   * Retrieves a list of microblock contents identified by their hashes.
   *
   * @param {string[]} list - An array of hashes of the microblocks to be retrieved.
   * @return {Promise} A promise that resolves with an array of objects { hash: string, content: Uint8Array() }.
   */
  static async getMicroblocks(list) {
    return await this.loadMicroblocks(list);
  }

  /**
   * Retrieves information about a virtual blockchain identified by its hash.
   *
   * @param {string} hash - The hash of the virtual blockchain to be processed.
   * @return {Promise} A promise that resolves with an object matching the schema MSG_ANS_VB_INFO.
   */
  static async getVirtualBlockchainInfo(hash) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_VB_INFO,
      {
        vbHash: hash
      }
    );

    return answer;
  }

  /**
   * Retrieves the list of microblocks of a virtual blockchain identified by its hash.
   *
   * @param {string} hash - The hash of the virtual blockchain to be processed.
   * @return {Promise} A promise that resolves with an object matching the schema MSG_ANS_VB_CONTENT.
   */
  static async getVirtualBlockchainContent(hash) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_VB_CONTENT,
      {
        vbHash: hash
      }
    );

    return answer;
  }

  /**
   * Retrieves the state of a specific account identified by its account hash.
   *
   * @param {string} accountHash - The hash of the account whose state is to be retrieved.
   * @return {Promise<{ height: number, balance: number, lastHistoryHash: string }>} A promise that resolves with the account state data.
   */
  static async getAccountState(accountHash) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_ACCOUNT_STATE,
      {
        accountHash: accountHash
      }
    );

    return answer;
  }

  /**
   * Retrieves the account history for a specific account, allowing the retrieval of specific records
   * based on a starting point such as the `lastHistoryHash`, and limiting the number of records returned.
   *
   * @param {string} accountHash - The unique hash of the account for which the history is requested.
   * @param {string} lastHistoryHash - The hash of the last history record to start fetching from.
   * @param {number} [maxRecords=50] - The maximum number of history records to retrieve. Defaults to 50 if not specified.
   * @returns {Promise<{
   *   height: number;
   *   previousHistoryHash: string;
   *   type: number;
   *   name: string;
   *   timestamp: object;
   *   linkedAccount: string;
   *   amount: number;
   *   chainReference: string;
   * }[]>} A promise that resolves to an array of account history entries. Each entry includes
   *         updated details such as a converted timestamp, a name derived from the type, and a decoded chain reference.
   */
  static async getAccountHistory(accountHash, lastHistoryHash, maxRecords = 50) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
      {
        accountHash: accountHash,
        lastHistoryHash: lastHistoryHash,
        maxRecords: maxRecords
      }
    );

    for(let entry of answer.list) {
      entry.timestamp = new Date(entry.timestamp * 1000);
      entry.name = ECO.BK_NAMES[entry.type];
      entry.amount *= entry.type & ECO.BK_PLUS ? 1 : -1;

      entry.chainReference = schemaSerializer.decode(
        ECO.BK_REF_SCHEMAS[ECO.BK_REFERENCES[entry.type]],
        entry.chainReference
      );
    }

    return answer.list;
  }

  /**
   * Retrieves the hash of an account virtual blockchain, given the account public key.
   *
   * @param {string} publicKey - The public key of the account whose VB hash is to be retrieved.
   * @return {Promise<string>} - A promise that resolves with the hash of the account virtual blockchain.
   */
  static async getAccountByPublicKey(publicKey) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY,
      {
        publicKey: publicKey
      }
    );

    return answer.accountHash;
  }

  static async getAccounts() {
    let answer = await this.nodeQuery(SCHEMAS.MSG_GET_ACCOUNTS, {});

    return answer.list;
  }

  static async getValidatorNodes() {
    let answer = await this.nodeQuery(SCHEMAS.MSG_GET_VALIDATOR_NODES, {});

    return answer.list;
  }

  static async getOrganizations() {
    let answer = await this.nodeQuery(SCHEMAS.MSG_GET_ORGANIZATIONS, {});

    return answer.list;
  }

  static async getApplications() {
    let answer = await this.nodeQuery(SCHEMAS.MSG_GET_APPLICATIONS, {});

    return answer.list;
  }

  static async getOracles() {
    let answer = await this.nodeQuery(SCHEMAS.MSG_GET_ORACLES, {});

    return answer.list;
  }
}
