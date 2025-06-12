import { Utils } from "../utils/utils.js";

export class MemoryProvider {
  constructor() {
    this.microblockInformationStore = new Map;
    this.microblockContentStore = new Map;
    this.virtualBlockchainStateStore = new Map; // TODO: should not be defined at all for a client
  }

  async getMicroblockInformation(identifier) {
    return await this.constructor.get(this.microblockInformationStore, identifier);
  }

  async getMicroblockContent(identifier) {
    return await this.constructor.get(this.microblockContentStore, identifier);
  }

  async getVirtualBlockchainState(identifier) {
    // TODO: for a client, this should always return null
    return await this.constructor.get(this.virtualBlockchainStateStore, identifier);
  }

  async setMicroblockInformation(identifier, data) {
    return await this.constructor.set(this.microblockInformationStore, identifier, data);
  }

  async setMicroblockContent(identifier, data) {
    return await this.constructor.set(this.microblockContentStore, identifier, data);
  }

  async setVirtualBlockchainState(identifier, data) {
    // TODO: for a client, this should not do anything
    return await this.constructor.set(this.virtualBlockchainStateStore, identifier, data);
  }

  static async get(store, identifier) {
    const key = Utils.binaryToHexa(identifier);

    if(!store.has(key)) {
      return null;
    }
    return store.get(key);
  }

  static async set(store, identifier, data) {
    const key = Utils.binaryToHexa(identifier);

    store.set(key, data);
  }
}
