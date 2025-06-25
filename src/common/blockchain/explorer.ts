import {Utils} from "../utils/utils";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Provider} from "../providers/provider";

export class Explorer {
  provider: any;
  constructor({
    provider
  }: {provider: Provider}) {
    this.provider = provider;
  }

  static createFromProvider(provider: Provider): Explorer {
    return new Explorer({provider});
  }

  async getMicroblockInformation(hashString: any) {
    return await this.provider.getMicroblockInformation(Utils.binaryFromHexa(hashString));
  }

  async getMicroblockBodys(hashes: any) {
    return await this.provider.getMicroblockBodys(hashes);
  }

  async getVirtualBlockchainState(identifierString: any) {
    const { stateData } = await this.provider.getVirtualBlockchainStateExternal(Utils.binaryFromHexa(identifierString));
    return BlockchainUtils.decodeVirtualBlockchainState(stateData);
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
