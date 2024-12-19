import { PROTOCOL, ERRORS, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { blockchainCore } from "./blockchainCore.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as sectionSerializer from "../serializers/section-serializer.js";
import * as crypto from "../crypto/crypto.js";
import * as network from "../network/network.js";
import * as keyValue from "../keyValue/keyValue.js";
import * as uint8 from "../util/uint8.js";
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

    this.sections = this.object.body.sections.map((serializedSection, sectionNdx) =>
      sectionSerializer.decode(this.object.header.height, sectionNdx, this.vbType, serializedSection)
    )
  }

  create(height, previousHash) {
    if(height == 1) {
      previousHash = uint8.toHexa(
        uint8.from(
          this.vbType,
          new Uint8Array(15),
          crypto.getRandomBytes(16)
        )
      );
    }

    this.object = {
      header: {
        magicString : MAGIC,
        version     : PROTOCOL.VERSION,
        height      : height,
        previousHash: previousHash,
        timestamp   : Math.floor(Date.now() / 1000),
        gas         : 0,
        gasPrice    : 0
      },
      body: {
        sections: []
      }
    };

    this.sections = [];
  }

  addSection(sectionId, object, keyRing, externalDef, schemaInfo) {
    let sectionObject = {
      id: sectionId,
      object: object
    };

    let serializedSection = sectionSerializer.encode(
      this.object.header.height,
      this.getSectionIndex(), 
      this.vbType,
      sectionObject,
      keyRing,
      externalDef,
      schemaInfo
    );

    this.object.body.sections.push(serializedSection);
    this.sections.push(sectionObject);
  }

  getSectionIndex() {
    return this.object.body.sections.length;
  }

  sign(privateKey) {
    this.updateGas(SECTIONS.SIGNATURE_SECTION_SIZE);

    let binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      this.object
    );

    return crypto.secp256k1.sign(privateKey, binary);
  }

  verifySignature(publicKey, signature) {
    let header = { ...this.object.header };

    let object = {
      header: header,
      body: { sections: this.object.body.sections.slice(0, -1) }
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

  finalize() {
    this.binary = schemaSerializer.encode(
      SCHEMAS.MICROBLOCK,
      this.object
    );

    if(this.object.header.gas != this.constructor.computeGas(this.binary.length)) {
      throw new blockchainError(ERRORS.BLOCKCHAIN_INVALID_GAS);
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
