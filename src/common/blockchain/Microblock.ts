import {CHAIN, ECO, SCHEMAS, SECTIONS} from "../constants/constants";
import {SchemaSerializer, SchemaUnserializer} from "../data/schemaSerializer";
import {Utils} from "../utils/utils";
import {Crypto} from "../crypto/crypto";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {MicroblockHeader, MicroblockSection} from "./types";
import {Hash} from "../entities/Hash";
import {CarmentisError} from "../errors/carmentis-error";
import {SectionType} from "../entities/SectionType";

export interface Section<T = any> {
    type: number,
    object: T,
    data: Uint8Array,
    hash: Uint8Array,
    index: number,
}

export class Microblock {
    gasPrice: number;
    hash: any;
    // @ts-ignore add initial value to the microblock header
    header: MicroblockHeader;
    sections: Section[];
    type: number;
    feesPayerAccount: Uint8Array | null;

    constructor(type: number) {
        this.type = type;
        this.sections = [];
        this.gasPrice = 0;
        this.feesPayerAccount = null;
        this.header = {
            magicString: CHAIN.MAGIC_STRING,
            protocolVersion: CHAIN.PROTOCOL_VERSION,
            height: 1,
            previousHash: Utils.getNullHash(),
            timestamp: 0,
            gas: 0,
            gasPrice: 0,
            bodyHash: Utils.getNullHash()
        };
    }

    /**
     Creates a microblock at a given height.
     If the height is greater than 1, a 'previousHash' is expected.
     */
    create(height: number, previousHash: Uint8Array | null, expirationDay: number) {
        if (height == 1) {
            const genesisSeed = Crypto.Random.getBytes(24);

            previousHash = Utils.getNullHash();
            previousHash[0] = this.type;
            previousHash[1] = expirationDay >> 24;
            previousHash[2] = expirationDay >> 16;
            previousHash[3] = expirationDay >> 8;
            previousHash[4] = expirationDay;
            previousHash.set(genesisSeed, 8);
        } else if (previousHash === null) {
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
        const headerUnserializer = new SchemaUnserializer<MicroblockHeader>(SCHEMAS.MICROBLOCK_HEADER);

        this.header = headerUnserializer.unserialize(headerData);

        const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

        if (!Utils.binaryIsEqual(this.header.bodyHash, bodyHash)) {
            throw new CarmentisError(`Body hash in the header is different of the locally computed body hash`);
        }

        this.hash = Crypto.Hashes.sha256AsBinary(headerData);
        this.gasPrice = this.header.gasPrice;

        const bodyUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_BODY);
        // @ts-expect-error TS(2339): Property 'body' does not exist on type '{}'.
        const body = bodyUnserializer.unserialize(bodyData).body;

        for (const {type, data} of body) {
            const sectionSchema = SECTIONS.DEF[this.type][type];
            const unserializer = new SchemaUnserializer(sectionSchema);
            const object = unserializer.unserialize(data);

            this.storeSection(type, object, data);
        }
    }

    /**
     * Retrieves the height of the header.
     *
     * @return {number} The height of the header as a numeric value.
     */
    getHeight(): number {
        return this.header.height;
    }

    /**
     * Retrieves the hash value of the previous block in the blockchain.
     *
     * @return {Hash} The hash object representing the previous block's hash.
     */
    getPreviousHash(): Hash {
        return Hash.from(this.header.previousHash);
    }

    getTimestamp(): number {
        return this.header.timestamp;
    }

    getGas(): number {
        return this.header.gas;
    }

    setGas(gas: number) {
        this.header.gas = gas;
    }

    setHeight(number: number) {
        this.header.height = number;
    }

    setGasPrice(gasPrice: number) {
        this.header.gasPrice = gasPrice;
    }

    getGasPrice(): number {
        return this.header.gasPrice;
    }

    getFeesPayerAccount() {
        return this.feesPayerAccount;
    }

    setTimestamp(timestamp: number) {
        this.header.timestamp = timestamp;
    }

    setFeesPayerAccount(account: Uint8Array) {
        this.feesPayerAccount = account;
    }

    /**
     Adds a section of a given type and defined by a given object.
     */
    addSection(type: SectionType, object: any): Section {
        const sectionSchema = SECTIONS.DEF[this.type][type];
        const serializer = new SchemaSerializer(sectionSchema);
        const data = serializer.serialize(object);

        return this.storeSection(type, object, data);
    }

    /**
     Stores a section, including its serialized data, hash and index.
     */
    storeSection(type: SectionType, object: any, data: any): Section {
        const hash = Crypto.Hashes.sha256AsBinary(data);
        const index = this.sections.length;

        const section = {type, object, data, hash, index};
        this.sections.push(section);

        return section;
    }

    /**
     Returns the first section for which the given callback function returns true.
     */
    getSection<T = any>(callback: (section: Section) => boolean): Section<T> {
        const section = this.sections.find((section: Section) => callback(section));
        if (section === undefined) throw new Error(`Section not found.`)
        return section;
    }

    /**
     * Retrieves a section by its type.
     *
     * @param {number} type - The type of the section to find.
     * @return {Section} The section object that matches the specified type.
     * @throws {Error} If no section with the specified type is found.
     */
    getSectionByType(type: number): Section {
        const section = this.sections.find((section: Section) => section.type === type);
        if (section === undefined) throw new Error(`Section not found.`);
        return section
    }

    /**
     * Retrieves the total number of sections.
     *
     * @return {number} The total count of sections.
     */
    getNumberOfSections(): number {
        return this.sections.length;
    }

    /**
     Returns all sections for which the given callback function returns true.
     */
    getSections<T = any>(callback: (section: Section) => boolean): Section<T>[] {
        return this.sections.filter((section: Section) => callback(section));
    }

    /**
     * Retrieves all sections without applying any filter criteria.
     *
     * @template T - The type of data contained within the sections.
     * @return {Section<T>[]} An array of sections with the specified type.
     */
    getAllSections<T = any>(): Section<T>[] {
        return this.getSections<T>(_ => true)
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
    verifySignature(publicKey: any, signature: any, includeGas: boolean, sectionCount: number) {
        const signedData = this.getSignedData(
            includeGas,
            sectionCount,
            0
        );

        return publicKey.verify(signedData, signature);
    }

    /**
     Generates the data to be signed:
     - the header with or without the gas data, and without the body hash
     - the list of section hashes
     */
    getSignedData(includeGas: boolean, sectionCount: number, extraBytes: number) {
        this.setGasData(includeGas, extraBytes);

        const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER);
        const headerData = serializer.serialize(this.header);
        const sections = this.sections.slice(0, sectionCount);

        return Utils.binaryFrom(
            headerData.slice(0, SCHEMAS.MICROBLOCK_HEADER_BODY_HASH_OFFSET),
            ...sections.map((section: any) => section.hash)
        );
    }

    /**
     Sets the gas data to either 0 or to their actual values.
     */
    setGasData(includeGas: boolean, extraBytes = 0) {
        if (includeGas) {
            this.header.gas = this.computeGas(extraBytes);
            this.header.gasPrice = this.gasPrice;
        } else {
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
                                     }: any) => ({type, data}))
        };

        this.setGasData(true);

        const bodySerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_BODY);
        const bodyData = bodySerializer.serialize(body);
        const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);

        this.header.bodyHash = bodyHash;

        const headerSerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER);
        const headerData = headerSerializer.serialize(this.header);
        const microblockHash = Crypto.Hashes.sha256AsBinary(headerData);

        this.hash = microblockHash;

        return {microblockHash, headerData, bodyHash, bodyData};
    }

    computeGas(extraBytes = 0) {
        const totalSize = this.sections.reduce((total: any, {
            data
        }: any) => total + data.length, extraBytes);
        return ECO.FIXED_GAS_FEE + ECO.GAS_PER_BYTE * totalSize;
    }
}
