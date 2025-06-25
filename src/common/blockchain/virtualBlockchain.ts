import { CHAIN } from "../constants/constants";
import { Microblock } from "./microblock";
import { Utils } from "../utils/utils";

export abstract class VirtualBlockchain {
  currentMicroblock: any;
  height: any;
  identifier: any;
  microblockHashes: any;
  provider: any;
  sectionCallbacks: any;
  state: any;
  type: any;
  constructor({
    provider,
    type
  }: any) {
    if(!CHAIN.VB_NAME[type]) {
      throw `Invalid virtual blockchain type '${type}'`;
    }
    this.provider = provider;
    this.sectionCallbacks = new Map;
    this.microblockHashes = [];
    this.currentMicroblock = null;
    this.state = {};
    this.type = type;
    this.height = 0;
  }


  abstract checkStructure(microblock: any): void;

  /**
    Registers a callback for a given section type.
  */
  registerSectionCallback(sectionType: any, callback: any) {
    this.sectionCallbacks.set(sectionType, callback.bind(this));
  }

  /**
    Loads a VB from its identifier.
  */
  async load(identifier: any) {
    const content = await this.provider.getVirtualBlockchainContent(identifier);

    if(!content) {
      throw `virtual blockchain ${Utils.binaryToHexa(identifier)} not found`;
    }

    if(this.type != content.state.type) {
      throw `inconsistent virtual blockchain type (expected ${this.type}, got ${content.state.type})`;
    }

    this.identifier = identifier;
    this.height = content.state.height;
    this.state = content.state.customState;
    this.microblockHashes = content.microblockHashes;
  }


  /**
    Imports a microblock defined by its header data and body data.
  */
  async importMicroblock(headerData: any, bodyData: any) {
    this.currentMicroblock = new Microblock(this.type);

    this.currentMicroblock.load(headerData, bodyData);
    this.checkStructure(this.currentMicroblock);

    for(const section of this.currentMicroblock.sections) {
      await this.processSectionCallback(this.currentMicroblock, section);
    }

    this.height++;

    if(this.currentMicroblock.header.height == 1) {
      this.identifier = this.currentMicroblock.hash;
    }

    return this.currentMicroblock.hash;
  }

  /**
    Returns the microblock at the given height.
  */
  async getMicroblock(height: any) {
    if(height == this.microblockHashes.length + 1 && this.currentMicroblock) {
      return this.currentMicroblock;
    }

    const hash = this.microblockHashes[height - 1];

    if(!hash) {
      throw `cannot retrieve microblock at height ${height}`;
    }

    const info = await this.provider.getMicroblockInformation(hash);
    const bodyList = await this.provider.getMicroblockBodys([ hash ]);

    const microblock = new Microblock(this.type);
    microblock.load(info.header, bodyList[0].body);

    return microblock;
  }

  /**
    Adds a section to the current microblock.
  */
  async addSection(type: any, object: any) {
    if(!this.currentMicroblock) {
      this.currentMicroblock = new Microblock(this.type);
      const previousHash = this.height ? this.microblockHashes[this.height - 1] : null;
      this.height++;
      this.currentMicroblock.create(this.height, previousHash);
    }

    const section = this.currentMicroblock.addSection(type, object);
    await this.processSectionCallback(this.currentMicroblock, section);
  }

  /**
    Processes a section callback (if defined).
  */
  async processSectionCallback(microblock: any, section: any) {
    if(this.sectionCallbacks.has(section.type)) {
      const callback = this.sectionCallbacks.get(section.type);
      await callback(microblock, section);
    }
  }

  /**
   * Creates a signature for the current microblock.
   *
   * @param {PrivateSignatureKey} privateKey
   * @param {boolean} withGas
   * @returns {{signature: (*|{signature})}}
   */
  createSignature(privateKey: any, withGas = true) {
    const signature = this.currentMicroblock.createSignature(privateKey, withGas);
    return { signature };
  }

  /**
   * Set the gas price for the current microblock.
   *
   * @param {number} price
   */
  setGasPrice(gasPrice: number) {
    this.currentMicroblock.gasPrice = gasPrice;
  }

  /**
    Publishes the current microblock.
  */
  async publish() {
//  console.log("publishing");
//  console.log(this.currentMicroblock.header);
//  console.log(this.currentMicroblock.sections);

    this.checkStructure(this.currentMicroblock);

    const { microblockHash, headerData, bodyHash, bodyData } = this.currentMicroblock.serialize();

    this.microblockHashes[this.height - 1] = microblockHash;

    if(this.height == 1) {
      this.identifier = microblockHash;
    }

    await this.provider.sendMicroblock(headerData, bodyData);
    await this.provider.awaitMicroblockAnchoring(microblockHash);

//  await this.provider.setMicroblockInformation(microblockHash, this.type, this.identifier, this.currentMicroblock.header.previousHash);
//  await this.provider.setMicroblockHeader(microblockHash, headerData);
//  await this.provider.setMicroblockBody(bodyHash, bodyData);
//  await this.provider.setVirtualBlockchainState(this.identifier, this.type, this.height, microblockHash, this.state);

    return Utils.binaryToHexa(microblockHash);
  }
}
