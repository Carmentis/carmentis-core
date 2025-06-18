import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class ApplicationLedgerVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_APP_LEDGER });

    this.state = {
      actors: [],
      channels: []
    };

    this.registerSectionCallback(SECTIONS.APP_LEDGER_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_ACTOR_CREATION, this.actorCreationCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_CHANNEL_CREATION, this.channelCreationCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, this.publicChannelDataCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, this.privateChannelDataCallback);
  }

  /**
    Update methods
  */
  async setSignatureAlgorithm(object) {
    await this.addSection(SECTIONS.APP_LEDGER_SIG_ALGORITHM, object);
  }

  async createActor(object) {
    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, object);
  }

  async createChannel(object) {
    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, object);
  }

  async addPublicChannelData(object) {
    await this.addSection(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, object);
  }

  async addPrivateChannelData(object) {
    await this.addSection(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async signAsAuthor(privateKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, object);
  }

  /**
    Helper methods
  */
  getChannelId(name) {
    const id = this.state.channels.findIndex(obj => obj.name == name);
    if(id == -1) {
      throw `unknown channel '${name}'`;
    }
    return id;
  }

  getActorId(name) {
    const id = this.state.actors.findIndex(obj => obj.name == name);
    if(id == -1) {
      throw `unknown actor '${name}'`;
    }
    return id;
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock, section) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async actorCreationCallback(microblock, section) {
    if(section.object.id != this.state.actors.length) {
      throw `invalid actor ID ${section.object.id}`;
    }
    if(this.state.actors.some(obj => obj.name == section.object.name)) {
      throw `actor '${section.object.name}' already exists`;
    }
    this.state.actors.push({
      name: section.object.name
    });
  }

  async channelCreationCallback(microblock, section) {
    if(section.object.id != this.state.channels.length) {
      throw `invalid channel ID ${section.object.id}`;
    }
    if(this.state.channels.some(obj => obj.name == section.object.name)) {
      throw `channel '${section.object.name}' already exists`;
    }
    this.state.channels.push({
      name: section.object.name,
      isPrivate: section.object.isPrivate
    });
  }

  async publicChannelDataCallback(microblock, section) {
    if(!this.state.channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  async privateChannelDataCallback(microblock, section) {
    if(!this.state.channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  /**
    Structure check
  */
  checkStructure(microblock) {
    const checker = new StructureChecker(microblock);
  }
}
