import { CHAIN, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer.js";
import { Utils } from "../utils/utils.js";
import { Crypto } from "../crypto/crypto.js";

export class Microblock {
  constructor(type) {
    this.type = type;
    this.sections = [];
    this.gasPrice = 0;
  }

  /**
    Creates a microblock at a given height.
    If the height is greater than 1, a 'previousHash' is expected.
  */
  create(height, previousHash) {
    if(height == 1) {
      const genesisSeed = Crypto.Random.getBytes(24);

      previousHash = new Uint8Array(32);
      previousHash[0] = this.type;
      previousHash.set(genesisSeed, 8);
    }
    else if(previousHash === undefined) {
      throw `previous hash not provided`;
    }

    this.header = {
      magicString: CHAIN.MAGIC_STRING,
      protocolVersion: CHAIN.PROTOCOL_VERSION,
      height: height,
      previousHash: previousHash,
      timestamp: 0,
      gas: 0,
      gasPrice: 0,
      bodyHash: new Uint8Array(32)
    };
  }

  /**
    Loads a microblock from its header data and body data.
  */
  load(headerData, bodyData) {
    const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);

    this.header = headerUnserializer.unserialize(headerData);

    const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

    if(!Utils.binaryIsEqual(this.header.bodyHash, bodyHash)) {
      throw `inconsistent body hash`;
    }

    this.hash = Crypto.Hashes.sha256AsBinary(headerData);

    const bodyUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_BODY),
          body = bodyUnserializer.unserialize(bodyData).body;

    for(const { type, data } of body) {
      const sectionDef = SECTIONS.DEF[this.type][type];
      const unserializer = new SchemaUnserializer(sectionDef.schema);
      const object = unserializer.unserialize(data);

      this.storeSection(type, object, data);
    }
  }

  /**
    Adds a section of a given type and defined by a given object.
  */
  addSection(type, object) {
    const sectionDef = SECTIONS.DEF[this.type][type];
    const serializer = new SchemaSerializer(sectionDef.schema);
    const data = serializer.serialize(object);

    return this.storeSection(type, object, data);
  }

  /**
    Stores a section, including its serialized data, hash and index.
  */
  storeSection(type, object, data) {
    const hash = Crypto.Hashes.sha256AsBinary(data);
    const index = this.sections.length;

    const section = { type, object, data, hash, index };
    this.sections.push(section);

    return section;
  }

  /**
    Returns the first section for which the given callback function returns true.
  */
  getSection(callback) {
    return this.sections.find((section) => callback(section));
  }

  /**
    Creates a signature.
  */
  createSignature(algorithmId, privateKey, includeGas) {
    const signedData = this.getSignedData(
      includeGas,
      this.sections.length,
      Crypto.SIG_ALGORITHMS[algorithmId].signatureSectionSize
    );

    let signature;

    switch(algorithmId) {
      case Crypto.SECP256K1: {
        signature = Crypto.Secp256k1.sign(privateKey, signedData);
        break;
      }
      case Crypto.ML_DSA: {
        signature = Crypto.MLDsa.sign(privateKey, signedData);
        break;
      }
    }

    return signature;
  }

  /**
    Verifies a signature.
  */
  verifySignature(algorithmId, publicKey, signature, includeGas, sectionCount) {
    const signedData = this.getSignedData(
      includeGas,
      sectionCount,
      0
    );

    switch(algorithmId) {
      case Crypto.SECP256K1: {
        return Crypto.Secp256k1.verify(publicKey, signedData, signature);
      }
      case Crypto.ML_DSA: {
        return Crypto.MLDsa.verify(publicKey, signedData, signature);
      }
    }
    return false;
  }

  /**
    Generates the data to be signed:
      - the header with or without the gas data, and without the body hash
      - the list of section hashes
  */
  getSignedData(includeGas, sectionCount, extraBytes) {
    this.setGasData(includeGas, extraBytes);

    const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER),
          headerData = serializer.serialize(this.header);

    const sections = this.sections.slice(0, sectionCount);

    return Utils.binaryFrom(
      headerData.slice(0, SCHEMAS.MICROBLOCK_HEADER_BODY_HASH_OFFSET),
      ...sections.map((section) => section.hash)
    );
  }

  /**
    Sets the gas data to either 0 or to their actual values.
  */
  setGasData(includeGas, extraBytes = 0) {
    if(includeGas) {
      const totalSize = this.sections.reduce((total, { data }) => total + data.length, extraBytes);

      this.header.gas = totalSize;
      this.header.gasPrice = this.gasPrice;
    }
    else {
      this.header.gas = 0;
      this.header.gasPrice = 0;
    }
  }

  /**
    Serializes the microblock and returns an object with the microblock hash, the header data,
    the body hash and the body data.
  */
  serialize() {
    const body = {
      body: this.sections.map(({ type, data }) => ({ type, data }))
    };

    this.setGasData(true);

    const bodySerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_BODY),
          bodyData = bodySerializer.serialize(body),
          bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

    this.header.bodyHash = bodyHash;

    const headerSerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER),
          headerData = headerSerializer.serialize(this.header),
          microblockHash = Crypto.Hashes.sha256AsBinary(headerData);

    this.hash = microblockHash;

    return { microblockHash, headerData, bodyHash, bodyData };
  }
}
