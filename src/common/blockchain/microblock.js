import { PROTOCOL, ERRORS, SCHEMAS, SECTIONS, ECO } from "../constants/constants.js";
import { blockchainCore } from "./blockchainCore.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as sectionSerializer from "../serializers/section-serializer.js";
import * as crypto from "../crypto/crypto.js";
import * as network from "../network/network.js";
import * as keyValue from "../keyValue/keyValue.js";
import * as uint8 from "../util/uint8.js";
import * as util from "../util/util.js";
import { blockchainError } from "../errors/error.js";

const MAGIC = "CMTS";

// ============================================================================================================================ //
//  microblock                                                                                                                  //
// ============================================================================================================================ //
export class microblock extends blockchainCore {
  constructor(vbType) {
    super();
    this.vbType = vbType;
  }

  load(binary, hash) {
    this.hash = hash;
    this.object = schemaSerializer.decode(SCHEMAS.MICROBLOCK, binary);
    this.sections = [];
  }

  create(height, previousHash) {
    let timestamp = util.getCarmentisTimestamp();

    if(height == 1) {
      let seed = crypto.getRandomBytes(16);

      previousHash = uint8.toHexa(
        uint8.from(
          this.vbType,
          new Uint8Array(15),
          seed
        )
      );
    }

    this.object = {
      header: {
        magicString    : MAGIC,
        protocolVersion: PROTOCOL.VERSION,
        height         : height,
        previousHash   : previousHash,
        timestamp      : timestamp,
        gas            : 0,
        gasPrice       : ECO.TOKEN
      },
      body: {
        sections: []
      }
    };

    this.sections = [];
  }

  async addSection(sectionId, object, keyManager, externalDef, schemaInfo) {
    let sectionObject = {
      id: sectionId,
      object: object
    };

    let section = await sectionSerializer.encode(
      this.object.header.height,
      this.getSectionIndex(), 
      this.vbType,
      sectionObject,
      keyManager,
      externalDef,
      schemaInfo
    );

    let serializedSection = schemaSerializer.encode(SCHEMAS.SECTION, section);

    this.object.body.sections.push(serializedSection);
    this.sections.push(sectionObject);
  }

  findSection(id, callback = _ => true) {
    let section = this.sections.find(section =>
      section.id == id && callback(section.object)
    );

    return section ? section.object : null;
  }

  getSectionIndex() {
    return this.object.body.sections.length;
  }

  sign(privateKey, includeGas) {
    if(includeGas) {
      this.updateGas(SECTIONS.SIGNATURE_SECTION_SIZE);
    }
    else {
      this.object.header.gas = 0;
      this.object.header.gasPrice = 0;
    }

    let binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      this.object
    );

    return crypto.secp256k1.sign(privateKey, binary);
  }

  verifySignature(publicKey, signature, includeGas, ignoredSections) {
    let header = { ...this.object.header };

    if(!includeGas) {
      header.gas = 0;
      header.gasPrice = 0;
    }

    let object = {
      header: header,
      body: { sections: this.object.body.sections.slice(0, -ignoredSections) }
    };

    let binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      object
    );

    return crypto.secp256k1.verify(publicKey, binary, signature);
  }

  updateGas(extraBytes = 0) {
    let binary;

    binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      this.object
    );

    this.object.header.gas = this.constructor.computeGas(binary.length + extraBytes);
  }

  getStructure() {
    return this.sections.map(section => `<${section.id}>`).join("");
  }

  finalize(includeGas, gasPrice) {
    if(includeGas) {
      if(gasPrice < ECO.MINIMUM_GAS_PRICE || gasPrice > ECO.MAXIMUM_GAS_PRICE) {
        throw new blockchainError(ERRORS.BLOCKCHAIN_MB_INVALID_GAS_PRICE);
      }
      this.object.header.gasPrice = gasPrice;
    }
    else {
      this.object.header.gas = 0;
      this.object.header.gasPrice = 0;
    }

    this.binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      this.object
    );

    if(this.binary.length > PROTOCOL.MAX_MICROBLOCK_SIZE) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_TOO_LARGE);
    }

    if(includeGas && this.object.header.gas != this.constructor.computeGas(this.binary.length)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_MB_INVALID_GAS);
    }

    this.hash = crypto.sha256(this.binary);

    return {
      hash: this.hash,
      header: this.object.header,
      sections: this.sections
    };
  }

  async broadcast() {
    let answer = await this.constructor.nodeQuery(
      SCHEMAS.MSG_SEND_MICROBLOCK,
      {
        data: this.binary
      }
    );
  }
}
