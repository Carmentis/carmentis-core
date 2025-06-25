import { CHAIN, ECO, SCHEMAS, SECTIONS } from "../constants/constants";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer";
import { Utils } from "../utils/utils";
import { Crypto } from "../crypto/crypto";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";

export interface Section {
  type: number,
  object: any,
  data: any,
  hash: Uint8Array,
  index: number,
}

export class Microblock {
  gasPrice: any;
  hash: any;
  header: any;
  sections: any;
  type: any;
  constructor(type: any) {
    this.type = type;
    this.sections = [];
    this.gasPrice = 0;
  }

  /**
    Creates a microblock at a given height.
    If the height is greater than 1, a 'previousHash' is expected.
  */
  create(height: any, previousHash: any) {
    if(height == 1) {
      const genesisSeed = Crypto.Random.getBytes(24);

      previousHash = Utils.getNullHash();
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
      timestamp: Utils.getTimestampInSeconds(),
      gas: 0,
      gasPrice: 0,
      bodyHash: Utils.getNullHash()
    };
  }

  /**
    Updates the timestamp.
  */
  updateTimestamp() {
    this.header.timestamp = Utils.getTimestampInSeconds();
  }

  /**
    Loads a microblock from its header data and body data.
  */
  load(headerData: any, bodyData: any) {
    const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);

    this.header = headerUnserializer.unserialize(headerData);

    const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

    if(!Utils.binaryIsEqual(this.header.bodyHash, bodyHash)) {
      throw `inconsistent body hash`;
    }

    this.hash = Crypto.Hashes.sha256AsBinary(headerData);

    const bodyUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_BODY),
          // @ts-expect-error TS(2339): Property 'body' does not exist on type '{}'.
          body = bodyUnserializer.unserialize(bodyData).body;

    for(const { type, data } of body) {
      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      const sectionDef = SECTIONS.DEF[this.type][type];
      const unserializer = new SchemaUnserializer(sectionDef.schema);
      const object = unserializer.unserialize(data);

      this.storeSection(type, object, data);
    }
  }

  /**
    Adds a section of a given type and defined by a given object.
  */
  addSection(type: any, object: any): Section {
    // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
    const sectionDef = SECTIONS.DEF[this.type][type];
    const serializer = new SchemaSerializer(sectionDef.schema);
    const data = serializer.serialize(object);

    return this.storeSection(type, object, data);
  }

  /**
    Stores a section, including its serialized data, hash and index.
  */
  storeSection(type: any, object: any, data: any) : Section {
    const hash = Crypto.Hashes.sha256AsBinary(data);
    const index = this.sections.length;

    const section = { type, object, data, hash, index };
    this.sections.push(section);

    return section;
  }

  /**
    Returns the first section for which the given callback function returns true.
  */
  getSection(callback: any) {
    return this.sections.find((section: any) => callback(section));
  }


  /**
   * Creates a digital signature using the provided private key and optionally includes gas-related data.
   *
   * @param {PrivateSignatureKey} privateKey - The private key used to sign the data.
   * @param {boolean} includeGas - A flag indicating whether gas-related data should be included in the signature.
   * @return {Uint8Array} The generated digital signature as a byte array.
   */
  createSignature(privateKey: PrivateSignatureKey, includeGas: boolean): Uint8Array {
    const signatureSize = privateKey.getSignatureSize()
    const signedData = this.getSignedData(
        includeGas,
        this.sections.length,
        signatureSize
    );

    return privateKey.sign(signedData)
  }

  /**
   * Verifies the provided cryptographic signature using the specified algorithm.
   *
   *
   *
   * @param {PublicSignatureKey} publicKey - The public key used to verify the signature.
   * @param {string} signature - The signature to be verified.
   * @param {boolean} includeGas - Indicates whether to include gas-related data in the signed payload.
   * @param {number} sectionCount - The number of sections to include in the signed data.
   * @return {boolean} Returns true if the signature is successfully verified; otherwise, returns false.
   */
  verifySignature(publicKey: any, signature: any, includeGas: any, sectionCount: any) {
    const signedData = this.getSignedData(
      includeGas,
      sectionCount,
      0
    );

    return publicKey.verify(signedData, signature);
    /*
    switch(algorithmId) {
      case Crypto.SECP256K1: {
        return Crypto.Secp256k1.verify(publicKey, signedData, signature);
      }
      case Crypto.ML_DSA: {
        return Crypto.MLDsa.verify(publicKey, signedData, signature);
      }
    }

     */
  }

  /**
    Generates the data to be signed:
      - the header with or without the gas data, and without the body hash
      - the list of section hashes
  */
  getSignedData(includeGas: any, sectionCount: any, extraBytes: any) {
    this.setGasData(includeGas, extraBytes);

    const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER),
          headerData = serializer.serialize(this.header);

    const sections = this.sections.slice(0, sectionCount);

    return Utils.binaryFrom(
      headerData.slice(0, SCHEMAS.MICROBLOCK_HEADER_BODY_HASH_OFFSET),
      ...sections.map((section: any) => section.hash)
    );
  }

  /**
    Sets the gas data to either 0 or to their actual values.
  */
  setGasData(includeGas: any, extraBytes = 0) {
    if(includeGas) {
      this.header.gas = this.computeGas(extraBytes);
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
      body: this.sections.map(({
        type,
        data
      }: any) => ({ type, data }))
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

  computeGas(extraBytes = 0) {
    const totalSize = this.sections.reduce((total: any, {
      data
    }: any) => total + data.length, extraBytes);
    return ECO.FIXED_GAS_FEE + ECO.GAS_PER_BYTE * totalSize;
  }
}
