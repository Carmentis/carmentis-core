import {Utils} from "../utils/utils";
import {MicroblockInformation} from "../blockchain/types";
import {ProviderInterface} from "./provider";

export class MemoryProvider  {
  microblockBodyStore: any;
  microblockInformationStore: any;
  virtualBlockchainStateStore: any;

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

  async getMicroblockInformation(hash: Uint8Array): Promise<Uint8Array> {
    
    return await MemoryProvider.get(this.microblockInformationStore, hash);
  }

  async getMicroblockBody(identifier: any) {
    
    return await MemoryProvider.get(this.microblockBodyStore, identifier);
  }

  async getVirtualBlockchainState(identifier: any) {
    
    return await MemoryProvider.get(this.virtualBlockchainStateStore, identifier);
  }

  async setMicroblockInformation(identifier: any, data: any) {
    
    return await MemoryProvider.set(this.microblockInformationStore, identifier, data);
  }

  async setMicroblockBody(identifier: any, data: any) {
    
    return await MemoryProvider.set(this.microblockBodyStore, identifier, data);
  }

  async setVirtualBlockchainState(identifier: any, data: any) {
    
    return await MemoryProvider.set(this.virtualBlockchainStateStore, identifier, data);
  }

  static async get(store: any, identifier: any) {
    const key = Utils.binaryToHexa(identifier);

    if(!store.has(key)) {
      return null;
    }
    return store.get(key);
  }

  static async set(store: any, identifier: any, data: any) {
    const key = Utils.binaryToHexa(identifier);

    store.set(key, data);
  }
}
