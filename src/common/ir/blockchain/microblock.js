import { CHAIN, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { SchemaSerializer, SchemaUnserializer } from "../serializers/schemaSerializer.js";
import { Utils } from "../utils/utils.js";
import { Crypto } from "../crypto/crypto.js";

export class Microblock {
  constructor(type) {
    this.type = type;
  }

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

    this.gasPrice = 0;
    this.sections = [];
  }

  load(headerData, bodyData) {
    const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);

    this.header = headerUnserializer.unserialize(headerData);

    const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

    if(!Utils.binaryIsEqual(this.header.bodyHash, bodyHash)) {
      throw `inconsistent body hash`;
    }

    const bodyUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_BODY),
          body = bodyUnserializer.unserialize(bodyData).body;

    for(const { type, data } of body) {
      const sectionDef = SECTIONS.DEF[this.type][type],
            unserializer = new SchemaUnserializer(sectionDef.schema),
            object = unserializer.unserialize(data);

      this.storeSection(type, object, data);
    }
  }

  addSection(type, object) {
    const sectionDef = SECTIONS.DEF[this.type][type],
          serializer = new SchemaSerializer(sectionDef.schema),
          data = serializer.serialize(object);

    return this.storeSection(type, object, data);
  }

  storeSection(type, object, data) {
    const hash = Crypto.Hashes.sha256AsBinary(data),
          index = this.sections.length;

    const section = { type, object, data, hash, index };
    this.sections.push(section);

    return section;
  }

  getSection(callback) {
    return this.sections.find(section => callback(section));
  }

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

  getSignedData(includeGas, sectionCount, extraBytes) {
    this.setGasData(includeGas, extraBytes);

    const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER),
          headerData = serializer.serialize(this.header);

    const sections = this.sections.slice(0, sectionCount);

    return Utils.binaryFrom(
      headerData,
      ...sections.map(section => section.hash)
    );
  }

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

    return { microblockHash, headerData, bodyHash, bodyData };
  }
}
