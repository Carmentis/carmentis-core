import { ID, ERRORS, SCHEMAS, SECTIONS, ECO } from "../constants/constants.js";
import { microblock } from "./microblock.js";
import { blockchainCore, ROLES } from "./blockchainCore.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as sectionSerializer from "../serializers/section-serializer.js";
import * as crypto from "../crypto/crypto.js";
import * as util from "../util/util.js";
import * as uint8 from "../util/uint8.js";
import { blockchainError } from "../errors/error.js";

// ============================================================================================================================ //
//  virtualBlockchain                                                                                                           //
// ============================================================================================================================ //
export class virtualBlockchain extends blockchainCore {
  constructor(type, id) {
    super();

    if(type !== undefined && !ID.OBJECT_NAME[type]) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_VB_TYPE, type);
    }

    this.id = id;
    this.type = type;
    this.microblocks = [];
    this.state = {};
    this.gasPrice = 0;

    if(!this.id) {
      this.createNewMicroblock();
    }
  }

  async load() {
    if(!util.isHash(this.id)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_VB_ID, this.id);
    }

    let vbContent = await this.constructor.getVbContent(this.id);

    if(this.type === undefined) {
      this.type = vbContent.type;
    }

    if(vbContent.type != this.type) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_VB_TYPE_MISMATCH, ID.OBJECT_NAME[this.type], ID.OBJECT_NAME[vbContent.type]);
    }

    let microblocks = await this.constructor.loadMicroblocks(vbContent.list);

    for(let obj of microblocks) {
      let mb = new microblock(this.type);

      mb.load(obj.content, obj.hash);
      this.setGenesisSeed(mb.object.header);
      this.microblocks.push(mb);
    }

    for(let mb of this.microblocks) {
      await this.processSections(mb);
    }

    await this.reloadSections();
  }

  async importCurrentMicroblock(binary, hash) {
    this.currentMicroblock = new microblock(this.type);
    this.currentMicroblock.load(binary, hash);
    this.setGenesisSeed(this.currentMicroblock.object.header);
    await this.processSections(this.currentMicroblock);

    await this.reloadSections();
  }

  // TODO: Must be improved.
  async reloadSections() {
    if(!this.constructor.isNode()) {
      for(let mb of this.microblocks) {
        mb.sections = [];
        await this.processSections(mb, false);
      }
    }
  }

  async processSections(mb, updateState = true) {
    for(let sectionNdx in mb.object.body.sections) {
      sectionNdx = +sectionNdx;

      let serializedSection = mb.object.body.sections[sectionNdx],
          sectionObject = schemaSerializer.decode(SCHEMAS.SECTION, serializedSection),
          externalDef = await this.getExternalDefinition(sectionObject);

      let section = await sectionSerializer.decode(
        mb.object.header.height,
        sectionNdx,
        this.type,
        sectionObject,
        this.keyManager.bind(this),
        externalDef
      );

      mb.sections.push(section);

      if(updateState) {
        await this.updateState(
          mb,
          sectionNdx,
          section.id,
          section.object
        );
      }
    }
  }

  async getExternalDefinition(sectionObject) {
    return null;
  }

  createNewMicroblock() {
    let height = this.getHeight(),
        previousHash = height > 1 ? this.microblocks[height - 2].hash : undefined;

    this.currentMicroblock = new microblock(this.type);
    this.currentMicroblock.create(height, previousHash);
    this.setGenesisSeed(this.currentMicroblock.object.header);
  }

  setGenesisSeed(mbHeader) {
    if(mbHeader.height == 1) {
      this.state.genesisSeed = crypto.sha256(
        uint8.from(
          util.intToByteArray(mbHeader.timestamp, 6),
          mbHeader.previousHash.slice(16)
        )
      );
    }
  }

  getSharedKey(myPrivateKey, theirPublicKey) {
    return crypto.ecdh.getSharedKey(myPrivateKey, theirPublicKey);
  }

  async keyManager() {
    return null;
  }

  getHeight() {
    return this.microblocks.length + 1;
  }

  async addSection(sectionId, object, externalDef, schemaInfo) {
    if(!this.currentMicroblock) {
      this.createNewMicroblock();
    }

    await this.currentMicroblock.addSection(
      sectionId,
      object,
      this.keyManager.bind(this),
      externalDef,
      schemaInfo
    );

    await this.updateState(
      this.currentMicroblock,
      this.currentMicroblock.sections.length - 1,
      sectionId,
      object
    );
  }

  async addSignature(privateKey, sectionId, includeGas = true) {
    let signature = this.currentMicroblock.sign(privateKey, includeGas);

    await this.addSection(sectionId, { signature: signature });

    return signature;
  }

  verifySignature(mb, publicKey, object, includeGas = true, ignoredSections = []) {
    if(!mb.verifySignature(publicKey, object.signature, includeGas, ignoredSections)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_SIGNATURE);
    }
  }

  updateGas() {
    this.currentMicroblock.updateGas();
  }

  async findSection(id, callback) {
    for(let n = this.microblocks.length; n--;) {
      let section = this.microblocks[n].findSection(id, callback);

      if(section) {
        return section;
      }
    }
    return null;
  }

  updateState() {
    throw "updateState() must be called from a child class";
  }

  setGasPrice(gasPrice) {
    this.currentMicroblock.object.header.gasPrice = gasPrice;
  }

  async computePrice() {
    if(!await this.checkStructure(this.currentMicroblock.getStructure())) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_MB_STRUCTURE);
    }

    let mb = this.currentMicroblock.finalize(true);

    return Math.round(mb.header.gas * mb.header.gasPrice / 1000);
  }

  getMicroblock(height) {
    let mb = [ ...this.microblocks, this.currentMicroblock ][height - 1];

    if(!mb) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_NOT_FOUND, height);
    }

    return mb;
  }

  getMicroblockData() {
    let mb = this.currentMicroblock.finalize(false);

    return mb;
  }

  async publish() {
    if(!await this.checkStructure(this.currentMicroblock.getStructure())) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_MB_STRUCTURE);
    }

    let mb = this.currentMicroblock.finalize(true);

    if(!this.microblocks.length) {
      this.id = mb.hash;
    }

    await this.currentMicroblock.broadcast();

    this.microblocks.push(this.currentMicroblock);
    this.currentMicroblock = null;

    return mb;
  }
}
