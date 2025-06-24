import { Utils } from "../utils/utils.js";

export class Explorer {
  constructor({ provider }) {
    this.provider = provider;
  }

  async getMicroblockInformation(hashString) {
    return await this.provider.getMicroblockInformation(Utils.binaryFromHexa(hashString));
  }

  async getMicroblockBodys(hashes) {
    return await this.provider.getMicroblockBodys(hashes);
  }

  async getAccountState(accountHashString) {
    return await this.provider.getAccountState(Utils.binaryFromHexa(accountHashString));
  }

  async getAccountHistory(accountHashString, lastHistoryHashString, maxRecords) {
    return await this.provider.getAccountHistory(
      Utils.binaryFromHexa(accountHashString),
      Utils.binaryFromHexa(lastHistoryHashString),
      maxRecords
    );
  }

  async getAccountByPublicKeyHash(publicKeyHashString) {
    return await this.provider.getAccountByPublicKeyHash(Utils.binaryFromHexa(publicKeyHashString));
  }
}
