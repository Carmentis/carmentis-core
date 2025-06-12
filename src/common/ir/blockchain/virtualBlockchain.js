import { CHAIN } from "../constants/constants.js";
import { Microblock } from "./microblock.js";

export class VirtualBlockchain {
  constructor({ provider, type }) {
    if(!CHAIN.VB_NAME[type]) {
      throw `Invalid VB type '${type}'`;
    }
    this.provider = provider;
    this.sectionCallbacks = new Map;
    this.microblockContents = new Map;
    this.microblockHashes = new Map;
    this.currentMicroblock = null;
    this.state = {};
    this.type = type;
    this.height = 0;
  }

  registerSectionCallback(type, callback) {
    this.sectionCallbacks.set(type, callback.bind(this));
  }

  async load(identifier) {
    const stateObject = await this.provider.getVirtualBlockchainState(identifier);

    if(this.type != stateObject.type) {
      throw `inconsistent virtual blockchain type`;
    }

    this.height = stateObject.height;
    this.state = stateObject.customState;
    this.microblockHashes.set(this.height, stateObject.lastMicroblockHash);

    console.log(this);
  }

  async importMicroblock(data) {
    const microblock = new Microblock(this.type);

    microblock.load(data);

    for(const section of microblock.sections) {
      await this.processSectionCallback(microblock, section);
    }
  }

  async getMicroblockByHeight(height) {
    if(this.microblockContents.has(height)) {
      return this.microblockContents.get(height);
    }

    if(!this.microblockHashes.has(height)) {
      await this.loadMicroblockHashes(height);
    }

    const hash = this.microblockHashes.get(height);

    return this.provider.getMicroblockContent(hash);
  }

  async loadMicroblockHashes(targetHeight) {
    let height = targetHeight,
        hash;

    while(height <= this.height) {
      if(this.microblockHashes.has(height)) {
        hash = this.microblockHashes.get(height);
        break;
      }
      height++;
    }

    if(height > this.height) {
      throw `internal error: all microblock hashes are unknown`;
    }

    const hashes = await this.provider.getMicroblockHashes(hash, targetHeight);
  }

  async addSection(type, object) {
    if(!this.currentMicroblock) {
      this.currentMicroblock = new Microblock(this.type);
      this.height++;
      this.currentMicroblock.create(this.height);
      this.microblockContents.set(this.height, this.currentMicroblock);
    }

    const section = this.currentMicroblock.addSection(type, object);
    await this.processSectionCallback(this.currentMicroblock, section);
  }

  async processSectionCallback(microblock, section) {
    if(this.sectionCallbacks.has(section.type)) {
      const callback = this.sectionCallbacks.get(section.type);
      await callback(microblock, section);
    }
  }

  createSignature(algorithmId, privateKey, withGas = true) {
    const signature = this.currentMicroblock.createSignature(algorithmId, privateKey, withGas);
    return { signature };
  }

  async publish() {
//  console.log(this.currentMicroblock.header);
//  console.log(this.currentMicroblock.sections);

    this.checkStructure(this.currentMicroblock);

    const { microblockHash, headerData, bodyHash, bodyData } = this.currentMicroblock.serialize();

    this.microblockHashes.set(this.height, microblockHash);

    if(this.height == 1) {
      this.identifier = microblockHash;
    }

    await this.provider.sendMicroblockContent(microblockHash, headerData, bodyData);

    await this.provider.setMicroblockInformation(microblockHash, this.type, this.identifier, this.currentMicroblock.header.previousHash);
//  await this.provider.setMicroblockHeader(microblockHash, headerData);
//  await this.provider.setMicroblockBody(bodyHash, bodyData);
    await this.provider.setVirtualBlockchainState(this.identifier, this.type, this.height, microblockHash, this.state);

    return microblockHash;
  }
}
