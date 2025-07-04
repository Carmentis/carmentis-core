import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./virtualBlockchain";
import {Application} from "./application";
import {StructureChecker} from "./structureChecker";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {ApplicationLedgerVBState} from "./types";
import {IntermediateRepresentation} from "../records/intermediateRepresentation";

export class ApplicationLedgerVb extends VirtualBlockchain<ApplicationLedgerVBState> {
  constructor({
    provider
  }: any) {
    super({ provider, type: CHAIN.VB_APP_LEDGER });
    this.state = {
      signatureAlgorithmId: -1,
      applicationId: new Uint8Array(0),
      actors: [],
      channels: []
    };

    this.registerSectionCallback(SECTIONS.APP_LEDGER_SIG_ALGORITHM, this.signatureAlgorithmCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_DECLARATION, this.declarationCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_ACTOR_CREATION, this.actorCreationCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_CHANNEL_CREATION, this.channelCreationCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, this.publicChannelDataCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, this.privateChannelDataCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE, this.endorserSignatureCallback);
    this.registerSectionCallback(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, this.authorSignatureCallback);
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
   * Signs the current object as the author using the provided private key.
   *
   * @param {PrivateSignatureKey} privateKey - The private key used to generate the author's signature.
   * @return {Promise<void>} A promise that resolves when the author's signature is successfully added to the ledger.
   */
  async signAsAuthor(privateKey: PrivateSignatureKey) {
    const object = this.createSignature(privateKey);
    await this.addSection(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, object);
  }

  /**
    Helper methods
  */
  getIntermediateRepresentationInstance() {
    const ir = new IntermediateRepresentation;

    const numberOfChannels = this.getNumberOfChannels();

    for(let channelId = 0; channelId < numberOfChannels; channelId++) {
      const channel = this.getChannelById(channelId);

      if(channel.isPrivate) {
        ir.addPrivateChannel(channelId);
      }
      else {
        ir.addPublicChannel(channelId);
      }
    }
    return ir;
  }

  getChannelId(name: string) {
    const id = this.getState().channels.findIndex((obj: any) => obj.name == name);
    if(id == -1) {
      throw `unknown channel '${name}'`;
    }
    return id;
  }

  getChannel(name: string) {
    const channel = this.getState().channels.find((obj: any) => obj.name == name);
    if(channel === undefined) {
      throw `unknown channel '${name}'`;
    }
    return channel;
  }

  getActorId(name: string) {
    const id = this.getState().actors.findIndex((obj: any) => obj.name == name);
    if(id == -1) {
      throw `unknown actor '${name}'`;
    }
    return id;
  }

  getActor(name: string) {
    const actor = this.getState().actors.find((obj: any) => obj.name == name);
    if(actor === undefined) {
      throw `unknown actor '${name}'`;
    }
    return actor;
  }

  /**
    Section callbacks
  */
  async signatureAlgorithmCallback(microblock: any, section: any) {
    this.getState().signatureAlgorithmId = section.object.algorithmId;
  }

  async declarationCallback(microblock: any, section: any) {
    this.getState().applicationId = section.object.applicationId;
  }

  async actorCreationCallback(microblock: any, section: any) {
    const state = this.getState();
    if(section.object.id != state.actors.length) {
      throw `invalid actor ID ${section.object.id}`;
    }
    if(state.actors.some((obj: any) => obj.name == section.object.name)) {
      throw `actor '${section.object.name}' already exists`;
    }
    state.actors.push({
      name: section.object.name,
      subscribed: false,
      invitations: []
    });
  }

  async channelCreationCallback(microblock: any, section: any) {
    const state = this.getState();
    if(section.object.id != state.channels.length) {
      throw `invalid channel ID ${section.object.id}`;
    }
    if(state.channels.some((obj: any) => obj.name == section.object.name)) {
      throw `channel '${section.object.name}' already exists`;
    }
    state.channels.push({
      name: section.object.name,
      isPrivate: section.object.isPrivate,
      creatorId: section.object.creatorId
    });
  }

  async publicChannelDataCallback(microblock: any, section: any) {
    if(!this.getState().channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  async privateChannelDataCallback(microblock: any, section: any) {
    if(!this.getState().channels[section.object.channelId]) {
      throw `invalid channel ID ${section.object.channelId}`;
    }
  }

  async endorserSignatureCallback(microblock: any, section: any) {
  }

  async authorSignatureCallback(microblock: any, section: any) {
    const application = new Application({ provider: this.provider });
    await application._load(this.getState().applicationId);
    const publicKey = await application.getOrganizationPublicKey();
    const feesPayerAccount = await this.provider.getAccountByPublicKey(publicKey);
    microblock.setFeesPayerAccount(feesPayerAccount);
  }

  /**
    Structure check
  */
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);
  }

  /**
   * Retrieves the application ID from the current state.
   *
   * @return {Uint8Array} The application ID as a Uint8Array.
   */
  getApplicationId(): Uint8Array {
    return this.getState().applicationId;
  }

  /**
   * Retrieves the total number of channels currently available.
   *
   * @return {number} The number of channels.
   */
  getNumberOfChannels() : number {
    return this.getState().channels.length;
  }

  /**
   * Retrieves a channel object by its unique identifier.
   *
   * @param {number} channelId - The unique identifier of the channel
   */
  getChannelById(channelId: number) {
    return this.getState().channels[channelId];
  }

  /**
   * Retrieves the total number of actors currently present in the state.
   *
   * @return {number} The number of actors.
   */
  getNumberOfActors(): number {
    return this.getState().actors.length
  }

  private static UNDEFINED_SIGNATURE_ALGORITHM_ID = -1;
  private static UNDEFINED_APPLICATION_ID = new Uint8Array(0);
  protected getInitialState(): ApplicationLedgerVBState {
    return {
      signatureAlgorithmId: ApplicationLedgerVb.UNDEFINED_SIGNATURE_ALGORITHM_ID,
      applicationId: ApplicationLedgerVb.UNDEFINED_APPLICATION_ID,
      actors: [],
      channels: []
    }
  }
}
