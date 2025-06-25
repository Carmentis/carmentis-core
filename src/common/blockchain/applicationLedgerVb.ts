import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";

export class ApplicationLedgerVb extends VirtualBlockchain {
  state: any;
  constructor({
    provider
  }: any) {
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
  async setSignatureAlgorithm(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_SIG_ALGORITHM, object);
  }

  async addDeclaration(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
  }

  async createActor(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, object);
  }

  async createChannel(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, object);
  }

  async addPublicChannelData(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, object);
  }

  async addPrivateChannelData(object: any) {
    await this.addSection(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, object);
  }

  /**
   *
   * @param {PrivateSignatureKey} privateKey
   * @returns {Promise<void>}
   */
  async signAsAuthor(privateKey: any) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, object);
  }

  /**
    Helper methods
  */
  getChannelId(name: any) {
    const id = this.state.channels.findIndex((obj: any) => obj.name == name);
    if(id == -1) {
      throw `unknown channel '${name}'`;
    }
    return id;
  }

  getActorId(name: any) {
    const id = this.state.actors.findIndex((obj: any) => obj.name == name);
    if(id == -1) {
      throw `unknown actor '${name}'`;
    }
    return id;
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.state.signatureAlgorithmId = section.object.algorithmId;
  }

  async actorCreationCallback(microblock: any, section: any) {
    if(section.object.id != this.state.actors.length) {
      throw `invalid actor ID ${section.object.id}`;
    }
    if(this.state.actors.some((obj: any) => obj.name == section.object.name)) {
      throw `actor '${section.object.name}' already exists`;
    }
    this.state.actors.push({
      name: section.object.name
    });
  }

  async channelCreationCallback(microblock: any, section: any) {
    if(section.object.id != this.state.channels.length) {
      throw `invalid channel ID ${section.object.id}`;
    }
    if(this.state.channels.some((obj: any) => obj.name == section.object.name)) {
      throw `channel '${section.object.name}' already exists`;
    }
    this.state.channels.push({
      name: section.object.name,
      isPrivate: section.object.isPrivate
    });
  }

  async publicChannelDataCallback(microblock: any, section: any) {
    if(!this.state.channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  async privateChannelDataCallback(microblock: any, section: any) {
    if(!this.state.channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  /**
    Structure check
  */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);
  }
}
