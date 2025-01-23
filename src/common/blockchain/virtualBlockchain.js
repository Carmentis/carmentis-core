import { ID, ERRORS, SECTIONS, ECO } from "../constants/constants.js";
import { microblock } from "./microblock.js";
import { blockchainCore, ROLES } from "./blockchainCore.js";
import * as crypto from "../crypto/crypto.js";
import * as util from "../util/util.js";
import { blockchainError } from "../errors/error.js";

// ============================================================================================================================ //
//  virtualBlockchain                                                                                                           //
// ============================================================================================================================ //
export class virtualBlockchain extends blockchainCore {
  constructor(type) {
    super();

    if(type !== undefined && !ID.OBJECT_NAME[type]) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_VB_TYPE, type);
    }

    this.type = type;
    this.microblocks = [];
    this.state = {};
    this.currentMicroblock = null;
    this.keyRing = new Map;
    this.gasPrice = 0;

    switch(this.constructor.role) {
      case ROLES.OPERATOR: {
        this.setKey(SECTIONS.KEY_OPERATOR, 0, this.constructor.rootKey);
        break;
      }
      case ROLES.USER: {
        this.setKey(SECTIONS.KEY_USER, 0, this.constructor.rootKey);
        break;
      }
    }
  }

  async load(hash) {
    if(!util.isHash(hash)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_VB_ID, hash);
    }

    this.id = hash;

    let vbContent = await this.constructor.getVbContent(hash);

    if(this.type === undefined) {
      this.type = vbContent.type;
    }

    if(vbContent.type != this.type) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_VB_TYPE_MISMATCH, ID.OBJECT_NAME[this.type], ID.OBJECT_NAME[vbContent.type]);
    }

    let microblocks = await this.constructor.loadMicroblocks(vbContent.list);

    this.microblocks = microblocks.map(obj => {
      let mb = new microblock(this.type);

      mb.load(obj.content, obj.hash);

      return mb;
    });

    for(let mb of this.microblocks) {
      await this.processSections(mb);
    }
  }

  async importCurrentMicroblock(binary, hash) {
    this.currentMicroblock = new microblock(this.type);
    this.currentMicroblock.load(binary, hash);
    await this.processSections(this.currentMicroblock);
  }

  async processSections(mb) {
    for(let ndx in mb.sections) {
      let section = mb.sections[ndx];

      await this.updateState(mb, ndx, section.id, section.object);
    }
  }

  createNewMicroblock() {
    let height = this.getHeight(),
        previousHash = this.microblocks.length ? this.microblocks[this.microblocks.length - 1].hash : undefined;

    this.currentMicroblock = new microblock(this.type);
    this.currentMicroblock.create(height, previousHash);
  }

  getSharedKey(myPrivateKey, theirPublicKey) {
    return crypto.ecdh.getSharedKey(myPrivateKey, theirPublicKey);
  }

  setKey(type, index, key) {
    return this.keyRing.set(type << 8 | index, key);
  }

  getKey(type, index) {
    return this.keyRing.get(type << 8 | index);
  }

  getHeight() {
    return this.microblocks.length + 1;
  }

  async addSection(sectionId, object, externalDef, schemaInfo) {
    if(!this.currentMicroblock) {
      this.createNewMicroblock();
    }
    this.currentMicroblock.addSection(sectionId, object, this.keyRing, externalDef, schemaInfo);
    await this.updateState(this.currentMicroblock, this.currentMicroblock.sections.length - 1, sectionId, object);
  }

  async addSignature(privateKey, sectionId) {
    let signature = this.currentMicroblock.sign(privateKey);

    await this.addSection(sectionId, { signature: signature });
  }

  verifySignature(mb, publicKey, object) {
    if(!mb.verifySignature(publicKey, object.signature)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_SIGNATURE);
    }
  }

  updateGas() {
    this.currentMicroblock.updateGas();
  }

  async findSection(id, callback = _ => true) {
    for(let n = this.microblocks.length; n--;) {
      let section = this.microblocks[n].sections.find(section =>
        section.id == id && callback(section.object)
      );

      if(section) {
        return section.object;
      }
    }
    return null;
  }

  updateState() {
    throw "updateState() must be called from a child class";
  }

  setGasPrice(gasPrice) {
    this.gasPrice = gasPrice;
  }

  async computePrice() {
    if(!await this.checkStructure(this.currentMicroblock.getStructure())) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_MB_STRUCTURE);
    }

    let mb = this.currentMicroblock.finalize(this.gasPrice);

    return Math.round(mb.header.gas * mb.header.gasPrice / 1000);
  }

  async publish() {
    if(!await this.checkStructure(this.currentMicroblock.getStructure())) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_BAD_MB_STRUCTURE);
    }

    let mb = this.currentMicroblock.finalize(this.gasPrice);

    if(!this.microblocks.length) {
      this.id = mb.hash;
    }

    await this.currentMicroblock.broadcast();

    this.microblocks.push(this.currentMicroblock);
    this.currentMicroblock = null;

    return mb;
  }
}
