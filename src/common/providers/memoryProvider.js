import { Utils } from "../utils/utils.js";

export class MemoryProvider {
  constructor() {
    this.microblockInformationStore = new Map;
    this.microblockBodyStore = new Map;
    this.virtualBlockchainStateStore = new Map;
  }

  clear() {
    this.microblockInformationStore = new Map;
    this.microblockBodyStore = new Map;
    this.virtualBlockchainStateStore = new Map;
  }

  async getMicroblockInformation(identifier) {
    return await this.constructor.get(this.microblockInformationStore, identifier);
  }

  async getMicroblockBody(identifier) {
    return await this.constructor.get(this.microblockBodyStore, identifier);
  }

  async getVirtualBlockchainState(identifier) {
    return await this.constructor.get(this.virtualBlockchainStateStore, identifier);
  }

  async setMicroblockInformation(identifier, data) {
    return await this.constructor.set(this.microblockInformationStore, identifier, data);
  }

  async setMicroblockBody(identifier, data) {
    return await this.constructor.set(this.microblockBodyStore, identifier, data);
  }

  async setVirtualBlockchainState(identifier, data) {
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
