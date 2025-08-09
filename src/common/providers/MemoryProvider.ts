import {Utils} from "../utils/utils";
import {MicroblockInformationSchema} from "../blockchain/types";

import {BlockchainReader} from "./BlockchainReader";

export class MemoryProvider  {

  private static instance: MemoryProvider = new MemoryProvider();

  static getInstance() {
    return this.instance;
  }

  microblockHeaderStore: any;
  microblockBodyStore: any;
  microblockVbInformationStore: any;
  virtualBlockchainStateStore: any;

  constructor() {
    this.microblockHeaderStore = new Map;
    this.microblockBodyStore = new Map;
    this.microblockVbInformationStore = new Map;
    this.virtualBlockchainStateStore = new Map;
  }

  clear() {
    this.microblockHeaderStore = new Map;
    this.microblockBodyStore = new Map;
    this.microblockVbInformationStore = new Map;
    this.virtualBlockchainStateStore = new Map;
  }

  async getMicroblockVbInformation(hash: Uint8Array): Promise<Uint8Array> {
    return await MemoryProvider.get(this.microblockVbInformationStore, hash);
  }

  async getMicroblock(identifier: any) {
    return new Uint8Array();
  }

  async getMicroblockHeader(identifier: any) {
    return await MemoryProvider.get(this.microblockHeaderStore, identifier);
  }

  async getMicroblockBody(identifier: any) {
    return await MemoryProvider.get(this.microblockBodyStore, identifier);
  }

  async getVirtualBlockchainState(identifier: any) {
    return await MemoryProvider.get(this.virtualBlockchainStateStore, identifier);
  }

  async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
    // TODO: this could (and should) be cached locally in order to avoid querying the network each time
    return null;
  }

  async setMicroblockVbInformation(identifier: any, data: any) {
    return await MemoryProvider.set(this.microblockVbInformationStore, identifier, data);
  }

  async setMicroblockHeader(identifier: any, data: any) {
    return await MemoryProvider.set(this.microblockHeaderStore, identifier, data);
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
