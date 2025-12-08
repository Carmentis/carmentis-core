import {CHAIN, ECO, SCHEMAS, SECTIONS} from "../../constants/constants";
import {SchemaSerializer, SchemaUnserializer} from "../../data/schemaSerializer";
import {Utils} from "../../utils/utils";
import {Crypto} from "../../crypto/crypto";
import {MicroblockBody, MicroblockHeaderObject} from "../../type/types";
import {Hash} from "../../entities/Hash";
import {CarmentisError, IllegalStateError, SectionNotFoundError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/SectionType";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {
    AccountCreationSection,
    AccountEscrowTransferSection,
    AccountPublicKeySection,
    AccountSignatureSection,
    AccountSigSchemeSection,
    AccountStakeSection,
    AccountTokenIssuanceSection,
    AccountTransferSection,
    AccountVestingTransferSection,
    ApplicationDeclarationSection,
    ApplicationDescriptionSection,
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerActorSubscriptionSection,
    ApplicationLedgerAllowedPkeSchemesSection,
    ApplicationLedgerAllowedSigSchemesSection,
    ApplicationLedgerAuthorSection,
    ApplicationLedgerAuthorSignatureSection,
    ApplicationLedgerChannelCreationSection,
    ApplicationLedgerChannelInvitationSection,
    ApplicationLedgerDeclarationSection,
    ApplicationLedgerEndorsementRequestSection,
    ApplicationLedgerEndorserSignatureSection,
    ApplicationLedgerPrivateChannelSection,
    ApplicationLedgerPublicChannelSection,
    ApplicationLedgerSharedKeySection,
    ApplicationSignatureSection,
    ApplicationSigSchemeSection,
    OrganizationDescriptionSection,
    OrganizationPublicKeySection,
    OrganizationServerSection,
    OrganizationSignatureSection,
    OrganizationSigSchemeSection,
    ProtocolNodeUpdateSection,
    ProtocolProtocolUpdateSection,
    ProtocolPublicKeySection,
    ProtocolSignatureSection,
    ProtocolSigSchemeSection,
    ValidatorNodeDeclarationSection,
    ValidatorNodeCometbftPublicKeyDeclarationSection,
    ValidatorNodeRpcEndpointSection,
    ValidatorNodeSignatureSection,
    ValidatorNodeSigSchemeSection,
    ValidatorNodeVotingPowerUpdateSection
} from "../../type/sections";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {BlockchainSerializer} from "../../data/BlockchainSerializer";
import {CMTSToken} from "../../economics/currencies/token";
import {EncoderFactory} from "../../utils/encoder";
import {Section} from "../../type/Section";
import {TimestampValidationResult} from "./TimestampValidationResult";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Logger} from "../../utils/Logger";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";

/**
 * Represents a microblock in the blockchain that contains sections of data.
 * Handles creation, modification, serialization and verification of microblock data.
 */
export class Microblock {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    /**
     * Creates a genesis microblock with specified type and expiration.
     * @param {number} mbType - The type of microblock to create
     * @param {number} expirationDay - The expiration day value
     * @returns {Microblock} A new genesis microblock instance
     * @deprecated Use a more specific microblock genesis creation method.
     */
    static createGenesisMicroblock(mbType: number, expirationDay: number = 0) {
        const mb = new Microblock(mbType);
        mb.create(1, null, expirationDay );
        return mb;
    }

    /**
     * Creates a new microblock with specified parameters.
     * @param {number} mbType - The type of microblock to create
     * @param {number} height - The height of the microblock in the chain
     * @param {Uint8Array} previousHash - The hash of the previous microblock
     * @param {number} expirationDay - The expiration day value
     * @returns {Microblock} A new microblock instance
     */
    static createMicroblock(mbType: number, height: number, previousHash: Uint8Array, expirationDay: number) {
        const mb = new Microblock(mbType);
        mb.create(height, previousHash, expirationDay );
        return mb;
    }

    /**
     * Creates a genesis microblock for account virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisAccountMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for validator node virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisValidatorNodeMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for application virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisApplicationMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for protocol virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisProtocolMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for organization virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisOrganizationMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN)
    };

    /**
     * Creates a genesis microblock for application ledger virtual blockchain.
     * @returns {Microblock} A new genesis microblock instance
     */
    static createGenesisApplicationLedgerMicroblock(): Microblock {
        return new Microblock(VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN)
    };


    static loadFromSerializedMicroblock(serializedMicroblock: Uint8Array, expectedMbType?: VirtualBlockchainType) {
        const {serializedHeader, serializedBody} = BlockchainSerializer.unserializeMicroblockSerializedHeaderAndBody(serializedMicroblock);
        return Microblock.loadFromSerializedHeaderAndBody(serializedHeader, serializedBody, expectedMbType);
    }

    static loadFromHeaderAndBody(header: MicroblockHeaderObject, body: MicroblockBody, expectedMbType?: VirtualBlockchainType): Microblock {
        // Validate that expected type matches if provided
        const microblockType = header.microblockType;
        if (expectedMbType !== undefined && expectedMbType !== microblockType) {
            throw new CarmentisError(
                `Microblock type mismatch: expected ${expectedMbType}, got ${microblockType} from header`
            );
        }

        const mb = new Microblock(microblockType);
        mb.header = header;

        // Validate basic header fields
        if (header.magicString != CHAIN.MAGIC_STRING) {
            throw new Error(`magic string '${CHAIN.MAGIC_STRING}' is missing`);
        }
        if (header.protocolVersion != CHAIN.PROTOCOL_VERSION) {
            throw new Error(`invalid protocol version (expected ${CHAIN.PROTOCOL_VERSION}, got ${header.protocolVersion})`);
        }


        // parse the body
        for (const {type, data} of body.body) {
            const sectionSchema = SECTIONS.DEF[microblockType][type];
            const unserializer = new SchemaUnserializer(sectionSchema);
            const object = unserializer.unserialize(data);

            mb.storeSection(type, object, data);
        }



        // we now proceed
        // we check that the hash of the body is consistent with the body hash contained in the header
        const computedBodyHash = mb.computeBodyHash();
        const bodyHashContainedInHeader = header.bodyHash;
        const areBodyHashMatching = Utils.binaryIsEqual(bodyHashContainedInHeader, computedBodyHash)
        if (!areBodyHashMatching) {
            const encoder = EncoderFactory.bytesToHexEncoder();
            throw new CarmentisError(
                `Body hash in the header is different of the locally computed body hash: header.bodyHash=${encoder.encode(bodyHashContainedInHeader)}, computed=${encoder.encode(computedBodyHash)}`
            );
        }

        // we compute the hash of the microblock being the hash of the serialized header and assign the gas price
        mb.setMicroblockHash(mb.computeHash());
        mb.gasPrice = header.gasPrice;

        return mb;
    }

    static loadFromSerializedHeaderAndBody(serializedHeader: Uint8Array, serializedBody: Uint8Array, expectedMbType?: VirtualBlockchainType): Microblock {
        const header = BlockchainSerializer.unserializeMicroblockHeader(serializedHeader);

        // Extract microblock type from header
        const microblockType = header.microblockType;

        // Validate that expected type matches if provided
        if (expectedMbType !== undefined && expectedMbType !== microblockType) {
            throw new CarmentisError(
                `Microblock type mismatch: expected ${expectedMbType}, got ${microblockType} from header`
            );
        }

        const mb = new Microblock(microblockType);
        mb.header = header;

        // Validate basic header fields
        if (header.magicString != CHAIN.MAGIC_STRING) {
            throw new Error(`magic string '${CHAIN.MAGIC_STRING}' is missing`);
        }
        if (header.protocolVersion != CHAIN.PROTOCOL_VERSION) {
            throw new Error(`invalid protocol version (expected ${CHAIN.PROTOCOL_VERSION}, got ${header.protocolVersion})`);
        }


        // we compute the hash of the microblock being the hash of the serialized header and assign the gas price
        mb.hash = Crypto.Hashes.sha256AsBinary(serializedHeader);
        mb.gasPrice = header.gasPrice;

        // we check that the hash of the body is consistent with the body hash contained in the header
        const computedBodyHash = Crypto.Hashes.sha256AsBinary(serializedBody);
        const bodyHashContainedInHeader = header.bodyHash;
        const areBodyHashMatching = Utils.binaryIsEqual(bodyHashContainedInHeader, computedBodyHash)
        if (!areBodyHashMatching) {
            const encoder = EncoderFactory.bytesToHexEncoder();
            throw new CarmentisError(
                `Body hash in the header is different of the locally computed body hash: header.bodyHash=${encoder.encode(bodyHashContainedInHeader)}, computed=${encoder.encode(computedBodyHash)}`
            );
        }

        // parse the body
        const bodyUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_BODY);
        // @ts-expect-error TS(2339): Property 'body' does not exist on type '{}'.
        const body = bodyUnserializer.unserialize(serializedBody).body;
        for (const {type, data} of body) {
            const sectionSchema = SECTIONS.DEF[microblockType][type];
            const unserializer = new SchemaUnserializer(sectionSchema);
            const object = unserializer.unserialize(data);

            mb.storeSection(type, object, data);
        }

        return mb;
    }

    /**
     * Computes the initial hash for the body by utilizing sections of a microblock.
     * This method uses an empty array of sections to determine the body hash.
     *
     * @return {Uint8Array} The computed hash of the body based on the provided sections.
     */
    private static computeInitialBodyHash(): Uint8Array {
        return Microblock.computeBodyHashFromSections([])
    }

    private static computeMicroblockHash(header: MicroblockHeaderObject) {
        const headerData = BlockchainSerializer.serializeMicroblockHeader(header);
        return Crypto.Hashes.sha256AsBinary(headerData);
    }

    private static computeBodyHashFromSections(sections: Section[]): Uint8Array {
        const body = {
            body: sections.map(({ type, data }) => ({type, data}))
        };
        const bodySerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_BODY);
        const bodyData = bodySerializer.serialize(body);
        return Crypto.Hashes.sha256AsBinary(bodyData);

    }


    /**
     * Generates a previous hash value for a genesis microblock.
     * @param {VirtualBlockchainType} mbType - The type of virtual blockchain
     * @param {number} expirationDay - The expiration day value
     * @returns {Uint8Array} The generated previous hash
     * @private
     */
    private static generatePreviousHashForGenesisMicroblock(mbType: VirtualBlockchainType, expirationDay = 0) {
        const genesisSeed = Crypto.Random.getBytes(24);

        const previousHash = Utils.getNullHash();
        previousHash[0] = mbType;
        previousHash[1] = expirationDay >> 24;
        previousHash[2] = expirationDay >> 16;
        previousHash[3] = expirationDay >> 8;
        previousHash[4] = expirationDay;
        previousHash.set(genesisSeed, 8);
        return previousHash
    }

    /**
     * Represents an instance of a logger used for microblock-level logging.
     */
    private static logger = Logger.getMicroblockLogger();

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------

    /**
     * Represents the price of gas.
     */
    private gasPrice: number;

    /**
     * A variable representing binary data encoded as a `Uint8Array`.
     *
     * This variable is typically used to handle cryptographic or hashed data.
     * It stores an array of 8-bit unsigned integers.
     *
     * Common use cases include:
     * - Storing hashes generated from input data using cryptographic algorithms.
     * - Transmitting compact binary data.
     * - Performing binary-level operations on arrays of unsigned integers.
     */
    private hash: Uint8Array;

    /**
     * Represents the header for a microblock.
     * The `MicroblockHeaderObject` provides metadata and essential details about the microblock,
     * such as its version, parent block reference, microblock sequence, and other relevant data.
     *
     * This object is integral for validating and processing microblocks and ensuring they
     * are chained properly within their respective blockchains.
     */
    private header: MicroblockHeaderObject;

    /**
     * Represents an array of sections.
     *
     * Each section contains structured data, typically used to divide or group related content
     * or functionality within a microblock.
     */
    private readonly sections: Section[];

    /**
     * Represents a virtual blockchain type.
     */
    private readonly type: VirtualBlockchainType;

    /**
     * Represents the account details responsible for paying applicable fees.
     * This variable can either hold a `Uint8Array`, containing the account id,
     * or be `null` if no account is specified.
     */
    private feesPayerAccount: Uint8Array | null;

    /**
     * Creates a new Microblock instance.
     * @param {VirtualBlockchainType} type - The type of virtual blockchain this microblock belongs to
     */
    constructor(type: VirtualBlockchainType) {
        const defaultExpirationDay = 0;
        const defaultTimestampInSeconds = Math.floor(Date.now() / 1000);
        const defaultGasPrice = CMTSToken.zero().getAmountAsAtomic();
        const initialHeader : MicroblockHeaderObject = {
            localStateUpdaterVersion: InternalStateUpdaterFactory.defaultInternalStateUpdaterVersionByVbType(type),
            magicString: CHAIN.MAGIC_STRING,
            protocolVersion: CHAIN.PROTOCOL_VERSION,
            microblockType: type,
            height: 1,
            previousHash: Microblock.generatePreviousHashForGenesisMicroblock(type, defaultExpirationDay),
            timestamp: defaultTimestampInSeconds,
            gas: 0,
            gasPrice: 0,
            bodyHash: Microblock.computeInitialBodyHash()
        };

        this.type = type;
        this.sections = [];
        this.gasPrice = defaultGasPrice;
        this.feesPayerAccount = null;
        this.header = initialHeader;
        this.hash = Microblock.computeMicroblockHash(initialHeader);
    }


    /**
     * Creates a microblock at a given height.
     * If the height is greater than 1, a 'previousHash' is expected.
     * @param height
     * @param previousHash
     * @param expirationDay
     * @deprecated Use Microblock.createGenesisMicroblock or Microblock.createMicroblock to create a microblock.
     */
    create(height: number, previousHash: Uint8Array | null, expirationDay: number) {
        if (height == 1) {
          previousHash = Microblock.generatePreviousHashForGenesisMicroblock(this.type, expirationDay);
        } else if (previousHash === null) {
            throw `previous hash not provided`;
        }

        this.header = {
            localStateUpdaterVersion: 1,
            magicString: CHAIN.MAGIC_STRING,
            protocolVersion: CHAIN.PROTOCOL_VERSION,
            microblockType: this.type,
            height: height,
            previousHash: previousHash,
            timestamp: Utils.getTimestampInSeconds(),
            gas: 0,
            gasPrice: 0,
            bodyHash: Utils.getNullHash()
        };
    }


    /**
     * Sets the local state updater version.
     * @param {number} localStateUpdaterVersion - The version number to set
     */
    setLocalStateUpdaterVersion(localStateUpdaterVersion: number) {
        this.header.localStateUpdaterVersion = localStateUpdaterVersion;
    }



    /**
     Updates the timestamp.
     */
    updateTimestamp() {
        this.header.timestamp = Utils.getTimestampInSeconds();
    }

    /**
     Loads a microblock from its header data and body data.
     @deprecated
     */
    load(headerData: any, bodyData: any) {
        const headerUnserializer = new SchemaUnserializer<MicroblockHeaderObject>(SCHEMAS.MICROBLOCK_HEADER);

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
     * Retrieves the hash of the microblock.
     */
    getHash(): Hash {
        return Hash.from(this.hash);
    }

    /**
     * Retrieves the hash of the microblock as bytes.
     */
    getHashAsBytes(): Uint8Array {
        return this.hash;
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

    getGas(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gas);
    }

    setGas(gas: CMTSToken) {
        this.header.gas = gas.getAmountAsAtomic();
    }

    setHeight(number: number) {
        this.header.height = number;
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.header.gasPrice = gasPrice.getAmountAsAtomic();
    }

    getGasPrice(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gasPrice);
    }

    isFeesPayerAccountDefined(): boolean {
        return this.feesPayerAccount instanceof Uint8Array;
    }

    getFeesPayerAccount(): Uint8Array {
        //if ((this.feesPayerAccount instanceof Uint8Array) == false )
        //    throw new IllegalStateError("Fees payer account undefined")
        return <Uint8Array<ArrayBufferLike>>this.feesPayerAccount;
    }

    setTimestamp(timestamp: number) {
        this.header.timestamp = timestamp;
    }

    setFeesPayerAccount(accountHash: Uint8Array) {
        // TODO(correctness): Should ensure that the fees payer account is defined
        //if (!(accountHash instanceof Uint8Array)) throw new TypeError(`Invalid fees payer account type: expected Uint8array, got ${typeof accountHash}`)
        this.feesPayerAccount = accountHash;
    }

   

    /**
     Stores a section, including its serialized data, hash and index.
     */
    private storeSection(type: SectionType, object: any, data: Uint8Array): Section {
        const hash = Crypto.Hashes.sha256AsBinary(data);
        const index = this.sections.length;

        const section = {type, object, data, hash, index};
        this.sections.push(section);

        // we update the body hash and microblock hash
        //this.setGasData(true); The setGasData method is no more required since we never update
        this.header.bodyHash = Microblock.computeBodyHashFromSections(this.sections);
        this.hash = Microblock.computeMicroblockHash(this.header)
        //const headerData = BlockchainSerializer.serializeMicroblockHeader(this.header);
        //this.hash = Crypto.Hashes.sha256AsBinary(headerData);
        return section;
    }



    computeBodyHash() {
        return Microblock.computeBodyHashFromSections(this.sections)
    }




    /**
     Serializes the microblock and returns an object with the microblock hash, the header data,
     the body hash and the body data.
     */
    serialize() {
        const body = {
            body: this.sections.map(({ type, data }) => ({type, data}))
        };

        // TODO: should not update the state here
        //this.setGasData(true);

        const bodySerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_BODY);
        const bodyData = bodySerializer.serialize(body);
        const bodyHash = Crypto.Hashes.sha256AsBinary(bodyData);


        const headerSerializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER);
        const headerData = headerSerializer.serialize(this.header);
        const microblockHash = Crypto.Hashes.sha256AsBinary(headerData);

        const microblockData = BlockchainSerializer.serializeMicroblockSerializedHeaderAndBody(
            headerData,
            bodyData
        )


        return {microblockHash, headerData, bodyHash, bodyData, microblockData};
    }


    


    /**
     *
     * Returns the first section for which the given callback function returns true.
     * @param callback
     * @throws SectionNotFoundError When no section matches.
     */
    getSection<T = any>(callback: (section: Section) => boolean): Section<T> {
        const section = this.sections.find((section: Section) => callback(section));
        if (section === undefined) throw new SectionNotFoundError()
        return section;
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

    getSectionsByType<T = any>(sectionType: SectionType): Section<T>[] {
        return this.getSections(s => s.type === sectionType);
    }

    getPublicChannelDataSections(): Section<ApplicationLedgerPublicChannelSection>[] {
        return this.getSectionsByType<ApplicationLedgerPublicChannelSection>(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA);
    }

    getPrivateChannelDataSections(): Section<ApplicationLedgerPrivateChannelSection>[] {
        return this.getSectionsByType<ApplicationLedgerPrivateChannelSection>(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA);
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
    async sign(privateKey: PrivateSignatureKey, includeGas: boolean = true): Promise<Uint8Array> {
        const signatureSize = privateKey.getSignatureSize()
        const signedData = this.serializeForSigning(
            includeGas,
            this.sections.length,
            signatureSize
        );

        const signature = await privateKey.sign(signedData)
        return signature
    }

    /**
     * Verifies the provided cryptographic signature using the specified algorithm.
     *
     * @param {PublicSignatureKey} publicKey - The public key used to verify the signature.
     * @param {string} signature - The signature to be verified.
     * @param {boolean} includeGas - Indicates whether to include gas-related data in the signed payload.
     * @param {number} sectionCount - The number of sections to include in the signed data.
     * @return {boolean} Returns true if the signature is successfully verified; otherwise, returns false.
     */
    async verifySignature(publicKey: PublicSignatureKey, signature: Uint8Array, includeGas?: boolean, sectionCount?: number): Promise<boolean> {
        const shouldIncludeGas = typeof includeGas === 'boolean' ? includeGas : true;
        const numberOfSectionsToIncludeInSignature = sectionCount || this.sections.length - 1;
        const signedData = this.serializeForSigning(
            shouldIncludeGas,
            numberOfSectionsToIncludeInSignature,
            0
        );

        return await publicKey.verify(signedData, signature);
    }

    /**
     * Validates whether a given timestamp is within an acceptable range.
     * Checks if the timestamp is too far in the past or too far in the future
     * compared to the reference timestamp.
     *
     * @param {number} [referenceTimestamp=Utils.getTimestampInSeconds()] - The reference timestamp to compare against. Defaults to the current timestamp in seconds.
     * @return {TimestampValidationResult} Returns the validation result:
     * VALID if the timestamp is within the range, TOO_FAR_IN_THE_PAST if it's too far in the past,
     * or TOO_FAR_IN_THE_FUTURE if it's too far in the future.
     */
    isTemporallyCloseTo(referenceTimestamp: number = Utils.getTimestampInSeconds()): TimestampValidationResult {
        // check if too far in the past
        const isTooFarInPast = this.header.timestamp < referenceTimestamp - CHAIN.MAX_MICROBLOCK_PAST_DELAY;
        if (isTooFarInPast) {
            return TimestampValidationResult.TOO_FAR_IN_THE_PAST
        }

        // check if too far in the future
        const isTooFarInFuture = this.header.timestamp > referenceTimestamp + CHAIN.MAX_MICROBLOCK_FUTURE_DELAY;
        if(isTooFarInFuture) {
            return TimestampValidationResult.TOO_FAR_IN_THE_FUTURE
        }

        return TimestampValidationResult.VALID
    }

    /**
     * Validates if the declared gas amount matches the computed gas amount.
     *
     * @return {boolean} Returns true if the declared gas is equal to the expected gas, otherwise false.
     */
    isDeclaringConsistentGas(): boolean {
        const mb = this;
        const declaredGas = mb.getGas().getAmountAsAtomic();
        const expectedGas = mb.computeGas().getAmountAsAtomic();
        return declaredGas === expectedGas;
    }

    /**
     * Computes the total fees based on the gas amount and gas price.
     *
     * @return {number} The calculated fees as an atomic value.
     */
    computeFees() {
        const gas = this.getGas();
        const gasPrice = this.getGasPrice();
        const fees = Math.floor(
            (gas.getAmountAsAtomic() * gasPrice.getAmountAsAtomic()) /
            ECO.GAS_UNIT,
        );
        return CMTSToken.createAtomic(fees);
    }

    /**
     * Serializes the microblock data for signing purposes.
     * The method includes the header data and a specified number of section hashes.
     * Optionally includes gas-related data in the serialization based on the input.
     *
     * @param {boolean} includeGas - Indicates whether gas-related data should be included in the serialization.
     * @param {number} sectionCount - The number of sections to include in the serialized output.
     * @param {number} extraBytes - Additional bytes for gas data to be factored in if includeGas is true.
     * @return {Uint8Array} The serialized binary representation of the microblock for signing.
     */
    serializeForSigning(includeGas: boolean, sectionCount?: number, extraBytes: number = 0): Uint8Array {
        // this.setGasData(includeGas, extraBytes);
        const signedHeader: MicroblockHeaderObject = {
            ...this.header,
            gas: includeGas ? this.computeGas(extraBytes).getAmountAsAtomic() : 0,
            gasPrice: includeGas ? this.header.gasPrice : 0
        }
        const headerData = BlockchainSerializer.serializeMicroblockHeader(signedHeader);
        //const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_HEADER);
        //const headerData = serializer.serialize(this.header);
        const sections = this.sections.slice(0, sectionCount || this.sections.length);

        // TODO: find another way
        const headerHash = headerData.slice(0, SCHEMAS.MICROBLOCK_HEADER_BODY_HASH_OFFSET);
        const sectionHashes = sections.map((section) => section.hash);
        const serializedMbForSigning = Utils.binaryFrom(
            headerHash,
            ...sectionHashes
        );
        return serializedMbForSigning;
    }

    /**
     *
     */
    hasSection(sectionType: SectionType) {
        try {
            this.getSectionByType(sectionType);
            return true;
        } catch (e) {
            if (e instanceof SectionNotFoundError) return false;
            throw e;
        }
    }

    getIndexOfSection(sectionType: SectionType): number {
        return this.sections.findIndex(section => section.type === sectionType);
    }

    /**
     *
     *  Sets the gas data to either 0 or to their actual values.
     *  @deprecated
     */
    setGasData(includeGas: boolean, extraBytes = 0) {
        if (includeGas) {
            this.header.gas = this.computeGas(extraBytes).getAmountAsAtomic();
            this.header.gasPrice = this.gasPrice;
        } else {
            this.header.gas = 0;
            this.header.gasPrice = 0;
        }
    }


    computeGas(extraBytes = 0) {
        const totalSize = this.sections.reduce((total: number, section: Section) =>
            total + section.data.length,
            extraBytes
        );
        return CMTSToken.createAtomic(
            ECO.FIXED_GAS_FEE + ECO.GAS_PER_BYTE * totalSize
        );
    }

    computeRetentionPeriod(mbTimestamp: number, expirationDay: number) {
    }

    /**
     * Returns the version of the local state update version defined in the microblock.
     */
    getLocalStateUpdateVersion() {
        return this.header.localStateUpdaterVersion;
    }

    /**
     * Returns the number of sections having the specified type in the microblock.
     * @param sectionType
     */
    countSectionsByType(sectionType: SectionType): number {
        return this.sections.filter(s => s.type === sectionType).length;
    }


    /**
     * Adds a new section of the specified type, serializes the provided object, and stores it.
     *
     * @param {SectionType} type - The type of the section to be added.
     * @param {any} object - The data object to be serialized and added as a section.
     * @return {Section} The newly created and stored section.
     */
    addSection(type: SectionType, object: any): Section {
        Microblock.logger.debug("Adding section of type {type} to microblock: {object}", () => ({
            type,
            object
        }))
        const sectionSchema = SECTIONS.DEF[this.type][type];
        const serializer = new SchemaSerializer(sectionSchema);
        const data = serializer.serialize(object);

        return this.storeSection(type, object, data);
    }

    /**
     * Removes and returns the last section from the sections stack.
     * Throws an IllegalStateError if there are no sections to pop.
     *
     * @return {Section} The last section removed from the sections stack.
     * @throws {IllegalStateError} If the sections stack is empty.
     */
    popSection(): Section {
        // attempt to pop the last section
        const removedSection = this.sections.pop();
        if (this.getNumberOfSections() == 0 || removedSection === undefined)
            throw new IllegalStateError("Cannot pop section from empty microblock");

        // update the microblock state
        this.header.bodyHash = Microblock.computeBodyHashFromSections(this.sections);
        this.hash = Microblock.computeMicroblockHash(this.header)

        return removedSection
    }

    /**
     * Adds an organization signature scheme section.
     */
    addOrganizationSignatureSchemeSection(object: OrganizationSigSchemeSection) {
        return this.addSection(SectionType.ORG_SIG_SCHEME, object);
    }

    /**
     * Adds an organization public key section.
     */
    addOrganizationPublicKeySection(object: OrganizationPublicKeySection) {
        return this.addSection(SectionType.ORG_PUBLIC_KEY, object);
    }

    /**
     * Adds an organization description section.
     */
    addOrganizationDescriptionSection(object: OrganizationDescriptionSection) {
        return this.addSection(SectionType.ORG_DESCRIPTION, object);
    }

    /**
     * Adds an organization signature section.
     */
    addOrganizationSignatureSection(object: OrganizationSignatureSection) {
        return this.addSection(SectionType.ORG_SIGNATURE, object);
    }

    /**
     * Adds an organization server section.
     */
    addOrganizationServerSection(object: OrganizationServerSection) {
        return this.addSection(SectionType.ORG_SERVER, object);
    }

    // Protocol sections
    /**
     * Adds a protocol signature scheme section.
     */
    addProtocolSignatureSchemeSection(object: ProtocolSigSchemeSection) {
        return this.addSection(SectionType.PROTOCOL_SIG_SCHEME, object);
    }

    /**
     * Adds a protocol public key section.
     */
    addProtocolPublicKeySection(object: ProtocolPublicKeySection) {
        return this.addSection(SectionType.PROTOCOL_PUBLIC_KEY, object);
    }

    /**
     * Adds a protocol protocol update section.
     */
    addProtocolProtocolUpdateSection(object: ProtocolProtocolUpdateSection) {
        return this.addSection(SectionType.PROTOCOL_PROTOCOL_UPDATE, object);
    }

    /**
     * Adds a protocol node update section.
     */
    addProtocolNodeUpdateSection(object: ProtocolNodeUpdateSection) {
        return this.addSection(SectionType.PROTOCOL_NODE_UPDATE, object);
    }

    /**
     * Adds a protocol signature section.
     */
    addProtocolSignatureSection(object: ProtocolSignatureSection) {
        return this.addSection(SectionType.PROTOCOL_SIGNATURE, object);
    }

    // Account sections
    /**
     * Adds an account signature scheme section.
     */
    addAccountSignatureSchemeSection(object: AccountSigSchemeSection) {
        return this.addSection(SectionType.ACCOUNT_SIG_SCHEME, object);
    }

    /**
     * Adds an account public key section.
     */
    addAccountPublicKeySection(object: AccountPublicKeySection) {
        return this.addSection(SectionType.ACCOUNT_PUBLIC_KEY, object);
    }

    /**
     * Adds an account token issuance section.
     */
    addAccountTokenIssuanceSection(object: AccountTokenIssuanceSection) {
        return this.addSection(SectionType.ACCOUNT_TOKEN_ISSUANCE, object);
    }

    /**
     * Adds an account creation section.
     */
    addAccountCreationSection(object: AccountCreationSection) {
        return this.addSection(SectionType.ACCOUNT_CREATION, object);
    }

    /**
     * Adds an account transfer section.
     */
    addAccountTransferSection(object: AccountTransferSection) {
        return this.addSection(SectionType.ACCOUNT_TRANSFER, object);
    }

    /**
     * Adds an account vesting transfer section.
     */
    addAccountVestingTransferSection(object: AccountVestingTransferSection) {
        return this.addSection(SectionType.ACCOUNT_VESTING_TRANSFER, object);
    }

    /**
     * Adds an account escrow transfer section.
     */
    addAccountEscrowTransferSection(object: AccountEscrowTransferSection) {
        return this.addSection(SectionType.ACCOUNT_ESCROW_TRANSFER, object);
    }

    /**
     * Adds an account stake section.
     */
    addAccountStakeSection(object: AccountStakeSection) {
        return this.addSection(SectionType.ACCOUNT_STAKE, object);
    }

    /**
     * Adds an account signature section.
     */
    addAccountSignatureSection(object: AccountSignatureSection) {
        return this.addSection(SectionType.ACCOUNT_SIGNATURE, object);
    }

    // Validator Node sections
    /**
     * Adds a validator node signature scheme section.
     */
    addValidatorNodeSignatureSchemeSection(object: ValidatorNodeSigSchemeSection) {
        return this.addSection(SectionType.VN_SIG_SCHEME, object);
    }

    /**
     * Adds a validator node declaration section.
     */
    addValidatorNodeDeclarationSection(object: ValidatorNodeDeclarationSection) {
        return this.addSection(SectionType.VN_DECLARATION, object);
    }

    /**
     * Adds a validator node cometbft public key declaration section.
     */
    addValidatorNodeCometbftPublicKeyDeclarationSection(object: ValidatorNodeCometbftPublicKeyDeclarationSection) {
        return this.addSection(SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION, object);
    }

    /**
     * Adds a validator node RPC endpoint section.
     */
    addValidatorNodeRpcEndpointSection(object: ValidatorNodeRpcEndpointSection) {
        return this.addSection(SectionType.VN_RPC_ENDPOINT, object);
    }

    /**
     * Adds a validator node network integration section.
     */
    addValidatorNodeVotingPowerUpdateSection(object: ValidatorNodeVotingPowerUpdateSection) {
        return this.addSection(SectionType.VN_VOTING_POWER_UPDATE, object);
    }

    /**
     * Adds a validator node signature section.
     */
    addValidatorNodeSignatureSection(object: ValidatorNodeSignatureSection) {
        return this.addSection(SectionType.VN_SIGNATURE, object);
    }

    // Application sections
    /**
     * Adds an application signature scheme section.
     */
    addApplicationSignatureSchemeSection(object: ApplicationSigSchemeSection) {
        return this.addSection(SectionType.APP_SIG_SCHEME, object);
    }

    /**
     * Adds an application declaration section.
     */
    addApplicationDeclarationSection(object: ApplicationDeclarationSection) {
        return this.addSection(SectionType.APP_DECLARATION, object);
    }

    /**
     * Adds an application description section.
     */
    addApplicationDescriptionSection(object: ApplicationDescriptionSection) {
        return this.addSection(SectionType.APP_DESCRIPTION, object);
    }

    /**
     * Adds an application signature section.
     */
    addApplicationSignatureSection(object: ApplicationSignatureSection) {
        return this.addSection(SectionType.APP_SIGNATURE, object);
    }

    // Application Ledger sections
    /**
     * Adds an application ledger allowed signature schemes section.
     */
    addApplicationLedgerAllowedSigSchemesSection(object: ApplicationLedgerAllowedSigSchemesSection) {
        return this.addSection(SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES, object);
    }

    /**
     * Adds an application ledger allowed PKE schemes section.
     */
    addApplicationLedgerAllowedPkeSchemesSection(object: ApplicationLedgerAllowedPkeSchemesSection) {
        return this.addSection(SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES, object);
    }

    /**
     * Adds an application ledger declaration section.
     */
    addApplicationLedgerDeclarationSection(object: ApplicationLedgerDeclarationSection) {
        return this.addSection(SectionType.APP_LEDGER_DECLARATION, object);
    }

    /**
     * Adds an application ledger actor creation section.
     */
    addApplicationLedgerActorCreationSection(object: ApplicationLedgerActorCreationSection) {
        return this.addSection(SectionType.APP_LEDGER_ACTOR_CREATION, object);
    }

    /**
     * Adds an application ledger channel creation section.
     */
    addApplicationLedgerChannelCreationSection(object: ApplicationLedgerChannelCreationSection) {
        return this.addSection(SectionType.APP_LEDGER_CHANNEL_CREATION, object);
    }

    /**
     * Adds an application ledger shared key section.
     */
    addApplicationLedgerSharedKeySection(object: ApplicationLedgerSharedKeySection) {
        return this.addSection(SectionType.APP_LEDGER_SHARED_SECRET, object);
    }

    /**
     * Adds an application ledger channel invitation section.
     */
    addApplicationLedgerChannelInvitationSection(object: ApplicationLedgerChannelInvitationSection) {
        return this.addSection(SectionType.APP_LEDGER_CHANNEL_INVITATION, object);
    }

    /**
     * Adds an application ledger actor subscription section.
     */
    addApplicationLedgerActorSubscriptionSection(object: ApplicationLedgerActorSubscriptionSection) {
        return this.addSection(SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION, object);
    }

    /**
     * Adds an application ledger public channel section.
     */
    addApplicationLedgerPublicChannelSection(object: ApplicationLedgerPublicChannelSection) {
        return this.addSection(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA, object);
    }

    /**
     * Adds an application ledger private channel section.
     */
    addApplicationLedgerPrivateChannelSection(object: ApplicationLedgerPrivateChannelSection) {
        return this.addSection(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA, object);
    }

    /**
     * Adds an application ledger author section.
     */
    addApplicationLedgerAuthorSection(object: ApplicationLedgerAuthorSection) {
        return this.addSection(SectionType.APP_LEDGER_AUTHOR, object);
    }

    /**
     * Adds an application ledger endorsement request section.
     */
    addApplicationLedgerEndorsementRequestSection(object: ApplicationLedgerEndorsementRequestSection) {
        return this.addSection(SectionType.APP_LEDGER_ENDORSEMENT_REQUEST, object);
    }

    /**
     * Adds an application ledger endorser signature section.
     */
    addApplicationLedgerEndorserSignatureSection(object: ApplicationLedgerEndorserSignatureSection) {
        return this.addSection(SectionType.APP_LEDGER_ENDORSER_SIGNATURE, object);
    }

    /**
     * Adds an application ledger author signature section.
     */
    addApplicationLedgerAuthorSignatureSection(object: ApplicationLedgerAuthorSignatureSection) {
        return this.addSection(SectionType.APP_LEDGER_AUTHOR_SIGNATURE, object);
    }


    /**
     * Retrieves a section by its type.
     *
     * @param {number} type - The type of the section to find.
     * @return {Section} The section object that matches the specified type.
     * @throws {SectionNotFoundError} If no section with the specified type is found.
     */
    getSectionByType<T = any>(type: number): Section<T> {
        const section = this.sections.find((section: Section) => section.type === type);
        if (section === undefined) throw new SectionNotFoundError();
        return section
    }
    
    // Organization sections
    getOrganizationDescriptionSection() {
        return this.getSectionByType<OrganizationDescriptionSection>(SectionType.ORG_DESCRIPTION);
    }

    getOrganizationSignatureSchemeSection() {
        return this.getSectionByType<OrganizationSigSchemeSection>(SectionType.ORG_SIG_SCHEME);
    }

    getOrganizationPublicKeySection() {
        return this.getSectionByType<OrganizationPublicKeySection>(SectionType.ORG_PUBLIC_KEY);
    }

    getOrganizationSignatureSection() {
        return this.getSectionByType<OrganizationSignatureSection>(SectionType.ORG_SIGNATURE);
    }

    getOrganizationServerSection() {
        return this.getSectionByType<OrganizationServerSection>(SectionType.ORG_SERVER);
    }

    // Protocol sections
    getProtocolSignatureSchemeSection() {
        return this.getSectionByType<ProtocolSigSchemeSection>(SectionType.PROTOCOL_SIG_SCHEME);
    }

    getProtocolPublicKeySection() {
        return this.getSectionByType<ProtocolPublicKeySection>(SectionType.PROTOCOL_PUBLIC_KEY);
    }

    getProtocolProtocolUpdateSection() {
        return this.getSectionByType<ProtocolProtocolUpdateSection>(SectionType.PROTOCOL_PROTOCOL_UPDATE);
    }

    getProtocolNodeUpdateSection() {
        return this.getSectionByType<ProtocolNodeUpdateSection>(SectionType.PROTOCOL_NODE_UPDATE);
    }

    getProtocolSignatureSection() {
        return this.getSectionByType<ProtocolSignatureSection>(SectionType.PROTOCOL_SIGNATURE);
    }

    // Account sections
    getAccountSignatureSchemeSection() {
        return this.getSectionByType<AccountSigSchemeSection>(SectionType.ACCOUNT_SIG_SCHEME);
    }

    getAccountPublicKeySection() {
        return this.getSectionByType<AccountPublicKeySection>(SectionType.ACCOUNT_PUBLIC_KEY);
    }

    getAccountTokenIssuanceSection() {
        return this.getSectionByType<AccountTokenIssuanceSection>(SectionType.ACCOUNT_TOKEN_ISSUANCE);
    }

    getAccountCreationSection() {
        return this.getSectionByType<AccountCreationSection>(SectionType.ACCOUNT_CREATION);
    }

    getAccountTransferSection() {
        return this.getSectionByType<AccountTransferSection>(SectionType.ACCOUNT_TRANSFER);
    }

    getAccountVestingTransferSection() {
        return this.getSectionByType<AccountVestingTransferSection>(SectionType.ACCOUNT_VESTING_TRANSFER);
    }

    getAccountEscrowTransferSection() {
        return this.getSectionByType<AccountEscrowTransferSection>(SectionType.ACCOUNT_ESCROW_TRANSFER);
    }

    getAccountStakeSection() {
        return this.getSectionByType<AccountStakeSection>(SectionType.ACCOUNT_STAKE);
    }

    getAccountSignatureSection() {
        return this.getSectionByType<AccountSignatureSection>(SectionType.ACCOUNT_SIGNATURE);
    }

    // Validator Node sections
    getValidatorNodeSignatureSchemeSection() {
        return this.getSectionByType<ValidatorNodeSigSchemeSection>(SectionType.VN_SIG_SCHEME);
    }

    getValidatorNodeDeclarationSection() {
        return this.getSectionByType<ValidatorNodeDeclarationSection>(SectionType.VN_DECLARATION);
    }

    getValidatorNodeDescriptionSection() {
        return this.getSectionByType<ValidatorNodeCometbftPublicKeyDeclarationSection>(SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION);
    }

    getValidatorNodeRpcEndpointSection() {
        return this.getSectionByType<ValidatorNodeRpcEndpointSection>(SectionType.VN_RPC_ENDPOINT);
    }

    getValidatorNodeNetworkIntegrationSection() {
        return this.getSectionByType<ValidatorNodeVotingPowerUpdateSection>(SectionType.VN_VOTING_POWER_UPDATE);
    }

    getValidatorNodeSignatureSection() {
        return this.getSectionByType<ValidatorNodeSignatureSection>(SectionType.VN_SIGNATURE);
    }

    // Application sections
    getApplicationSignatureSchemeSection() {
        return this.getSectionByType<ApplicationSigSchemeSection>(SectionType.APP_SIG_SCHEME);
    }

    getApplicationDeclarationSection() {
        return this.getSectionByType<ApplicationDeclarationSection>(SectionType.APP_DECLARATION);
    }

    getApplicationDescriptionSection() {
        return this.getSectionByType<ApplicationDescriptionSection>(SectionType.APP_DESCRIPTION);
    }

    getApplicationSignatureSection() {
        return this.getSectionByType<ApplicationSignatureSection>(SectionType.APP_SIGNATURE);
    }

    // Application Ledger sections
    getApplicationLedgerAllowedSigSchemesSection() {
        return this.getSectionByType<ApplicationLedgerAllowedSigSchemesSection>(SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES);
    }

    getApplicationLedgerAllowedPkeSchemesSection() {
        return this.getSectionByType<ApplicationLedgerAllowedPkeSchemesSection>(SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES);
    }

    getApplicationLedgerDeclarationSection() {
        return this.getSectionByType<ApplicationLedgerDeclarationSection>(SectionType.APP_LEDGER_DECLARATION);
    }

    getApplicationLedgerActorCreationSection() {
        return this.getSectionByType<ApplicationLedgerActorCreationSection>(SectionType.APP_LEDGER_ACTOR_CREATION);
    }

    getApplicationLedgerChannelCreationSection() {
        return this.getSectionByType<ApplicationLedgerChannelCreationSection>(SectionType.APP_LEDGER_CHANNEL_CREATION);
    }

    getApplicationLedgerSharedKeySection() {
        return this.getSectionByType<ApplicationLedgerSharedKeySection>(SectionType.APP_LEDGER_SHARED_SECRET);
    }

    getApplicationLedgerChannelInvitationSection() {
        return this.getSectionByType<ApplicationLedgerChannelInvitationSection>(SectionType.APP_LEDGER_CHANNEL_INVITATION);
    }

    getApplicationLedgerActorSubscriptionSection() {
        return this.getSectionByType<ApplicationLedgerActorSubscriptionSection>(SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION);
    }

    getApplicationLedgerPublicChannelSection() {
        return this.getSectionByType<ApplicationLedgerPublicChannelSection>(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA);
    }

    getApplicationLedgerPrivateChannelSection() {
        return this.getSectionByType<ApplicationLedgerPrivateChannelSection>(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA);
    }

    getApplicationLedgerAuthorSection() {
        return this.getSectionByType<ApplicationLedgerAuthorSection>(SectionType.APP_LEDGER_AUTHOR);
    }

    getApplicationLedgerEndorsementRequestSection() {
        return this.getSectionByType<ApplicationLedgerEndorsementRequestSection>(SectionType.APP_LEDGER_ENDORSEMENT_REQUEST);
    }

    getApplicationLedgerEndorserSignatureSection() {
        return this.getSectionByType<ApplicationLedgerEndorserSignatureSection>(SectionType.APP_LEDGER_ENDORSER_SIGNATURE);
    }

    getApplicationLedgerAuthorSignatureSection() {
        return this.getSectionByType<ApplicationLedgerAuthorSignatureSection>(SectionType.APP_LEDGER_AUTHOR_SIGNATURE);
    }
    
    toString(): string {
        const encoder = EncoderFactory.bytesToHexEncoder();
        let output = `Microblock:\n`;
        output += `  Hash: ${encoder.encode(this.hash)}\n`;
        output += `  Fees payer account: ${this.feesPayerAccount ? encoder.encode(this.feesPayerAccount) : "Null"}\n`;
        output += `  Header:\n`;
        output += `    Magic String: ${this.header.magicString}\n`;
        output += `    Protocol Version: ${this.header.protocolVersion}\n`;
        output += `    Height: ${this.header.height}\n`;
        output += `    Previous Hash: ${encoder.encode(this.header.previousHash)}\n`;
        output += `    Timestamp: ${this.header.timestamp}\n`;
        output += `    Gas: ${this.header.gas}\n`;
        output += `    Gas Price: ${this.header.gasPrice}\n`;
        output += `    Body Hash: ${encoder.encode(this.header.bodyHash)}\n`;
        output += `    Local State Updater Version: ${this.header.localStateUpdaterVersion}\n`;

        output += `  Sections (${this.sections.length}):\n`;
        this.sections.forEach((section, index) => {
            output += `    Section ${index}:\n`;
            output += `      Section Type: ${section.type}\n`;
            output += `      Section Hash: ${encoder.encode(section.hash)}\n`;
            output += `      Section Data Length: ${section.data.length} bytes\n`;
            output += `      Section Object: ${JSON.stringify(section.object, null).replace(/\n/g, '\n      ')}\n`;
        });

        return output;
    }

    /**
     *
     */
    getType(): VirtualBlockchainType {
        return this.type;
    }

    setPreviousHash(previousHash: Hash) {
        this.header.previousHash = previousHash.toBytes()
    }

    static extractTypeFromGenesisPreviousHash(genesisPreviousHash: Uint8Array) {
        const type = genesisPreviousHash[0];
        return type;
    }

    static extractExpirationDayFromGenesisPreviousHash(genesisPreviousHash: Uint8Array) {
        const expirationDay =
            genesisPreviousHash[1] << 24 |
            genesisPreviousHash[2] << 16 |
            genesisPreviousHash[3] << 8 |
            genesisPreviousHash[4];
        return expirationDay;
    }

    getBodyHashInHeader() {
        return this.header.bodyHash;
    }

    isDeclaringConsistentBodyHash() {
        const bodyHash = this.computeBodyHash();
        return Utils.binaryIsEqual(bodyHash, this.header.bodyHash)
    }

    isGenesisMicroblock() {
        return this.getHeight() === 1;
    }

    setBodyHash(bodyHash: Uint8Array<ArrayBufferLike>) {
        this.header.bodyHash = bodyHash;
    }

    computeHash() {
        const {microblockHash} = this.serialize();
        return microblockHash;
    }

    setMicroblockHash(hash: Uint8Array) {
        this.hash = hash;
    }
}
