import { Utils } from "../utils/utils";

export class Explorer {
  provider: any;
  constructor({
    provider
  }: any) {
    this.provider = provider;
  }

  async getMicroblockInformation(hashString: any) {
    return await this.provider.getMicroblockInformation(Utils.binaryFromHexa(hashString));
  }

  async getMicroblockBodys(hashes: any) {
    return await this.provider.getMicroblockBodys(hashes);
  }

  async getAccountState(accountHashString: any) {
    return await this.provider.getAccountState(Utils.binaryFromHexa(accountHashString));
  }

  async getAccountHistory(accountHashString: any, lastHistoryHashString: any, maxRecords: any) {
    return await this.provider.getAccountHistory(
      Utils.binaryFromHexa(accountHashString),
      Utils.binaryFromHexa(lastHistoryHashString),
      maxRecords
    );
  }

  async getAccountByPublicKeyHash(publicKeyHashString: any) {
    return await this.provider.getAccountByPublicKeyHash(Utils.binaryFromHexa(publicKeyHashString));
  }
}
