/**
  This is the dummy external provider for nodes.
*/
export class NullNetworkProvider {
  constructor() {
  }

  async getMicroblockInformation() {
    return null;
  }

  async getMicroblockBodys() {
    return null;
  }

  async getVirtualBlockchainUpdate() {
    return { changed: false, exists: true };
  }
}
