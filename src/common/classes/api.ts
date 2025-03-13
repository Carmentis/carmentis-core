import * as util from '../util/data';
import * as constants from '../constants/data';
import {BK_PLUS} from "../constants/economics";
import {blockchainQuery, blockchainCore} from "../blockchain/blockchain";

export class BlockchainQueryFabric {
    public static build( nodeUrl: string ): BlockchainQuery {
        blockchainQuery.setNode( nodeUrl );
        blockchainCore.setNode( nodeUrl );
        return new BlockchainQuery();
    }
}

export class BlockchainQuery {

    constructor() {}

    /**
     * Fetches the account hash associated with the given public key.
     *
     * @param {string} publicKey - The public key of the account to fetch the hash for.
     * @return {Promise<any>} A promise that resolves to the account hash associated with the public key.
     */
    async fetchAccountHashByPublicKey( publicKey: string ) {
        return await blockchainQuery.getAccountByPublicKey(publicKey);
    }

    /**
     * Retrieves a list of account transactions for a given public key.
     *
     * @param {string} publicKey - The public key of the account to fetch transactions for.
     * @param {number} entriesLimit - The maximum number of transaction entries to retrieve.
     * @return {Promise<Array<TokenTransaction>>} A promise that resolves to an array of TokenTransaction objects.
     */
    async fetchAccountTransactionsByPublicKey( publicKey: string, entriesLimit: number ){
        const accountVbHash = await blockchainQuery.getAccountByPublicKey(publicKey);
        const accountState = await blockchainQuery.getAccountStateObject(accountVbHash);
        const history = await blockchainQuery.getAccountHistory(
            accountVbHash,
            accountState.getLastHistoryHash(),
            entriesLimit
        );

        const tokenTransactions = history.map((h: TokenTransactionInterface) => TokenTransaction.build(h));
        return tokenTransactions
    }

    /**
     * Fetches the account state object for a given public key.
     *
     * @param {string} publicKey - The public key of the account to retrieve the state for.
     * @return {Promise<object>} A promise that resolves to the account state object.
     */
    async fetchAccountStateByPublicKey( publicKey: string ){
        const accountVbHash = await blockchainQuery.getAccountByPublicKey(publicKey);
        return await blockchainQuery.getAccountStateObject(accountVbHash);
    }


    /**
     * Retrieves the hash of oracles by querying the blockchain.
     * This method makes an asynchronous call to fetch the oracles information.
     *
     * @return {Promise<any>} A promise that resolves to the hash of oracles obtained from the blockchain.
     */
    async getOraclesHash() {
        return await blockchainQuery.getOracles();
    }

    /**
     * Retrieves the hash of organizations from the blockchain.
     *
     * @return {Promise<Object>} A promise that resolves to an object containing the organizations' hash data retrieved from the blockchain.
     */
    async getOrganisationsHash() {
        return await blockchainQuery.getOrganizations();
    }


    /**
     * Retrieves the hash of applications from the blockchain query.
     *
     * @return {Promise<Object>} A promise that resolves to the hash of applications fetched from the blockchain.
     */
    async getApplicationsHash() {
        return await blockchainQuery.getApplications();
    }


    /**
     * Fetches the hash of accounts by querying the blockchain.
     *
     * @return {Promise<any>} A promise that resolves to the hash of accounts retrieved from the blockchain.
     */
    async getAccountsHash() {
        return await blockchainQuery.getAccounts()
    }


    /**
     * Retrieves the master block for the specified height from the blockchain.
     *
     * @param {number} height - The block height to fetch the master block for.
     * @return {Promise<MasterBlock>} A promise that resolves to a MasterBlock object containing block information and content.
     */
    async getMasterBlock( height: number ) {
        const info = await blockchainQuery.getBlockInfoObject(height)
        const content = await blockchainQuery.getBlockContentObject( height );
        return new MasterBlock(info, content);
    }


    /**
     * Retrieves the content of a microblock based on the provided hash.
     *
     * @param {string} hash - The hash of the microblock to retrieve.
     * @return {Promise<MicroBlock>} A promise that resolves to the microblock's  object.
     */
    async getMicroBlock( hash: string ) {
        return await blockchainQuery.getMicroblockContentObject(hash)
    }

    /**
     * Fetches the current chain status by querying the blockchain.
     *
     * @return {Promise<ChainStatus>} A promise that resolves to the chain status object.
     */
    async getChainStatus() {
        return ChainStatus.build(await blockchainQuery.getChainStatus());
    }
}

export class MasterBlock {
    private info: MasterBlockInfo;
    private content: MasterBlockContent;

    constructor(info: MasterBlockInfo, content: MasterBlockContent) {
        this.info = info;
        this.content = content;
    }

    getHash(): string {
        return this.info.getHash();
    }

    getHeight(): number {
        return this.info.getHeight();
    }

    getProposedAt(): Date {
        return this.info.getProposedAt();
    }

    getProposerNode(): string {
        return this.info.getProposerNode();
    }

    getSignature(): string {
        return this.getSignature();
    }

    getMicroBlocksHash(): string[] {
        return this.content.getMicroBlocksHash()
    }
}


export interface ChainStatusInterface {
    lastBlockHeight: number;
    timeToNextBlock: number;
    nSection: number;
    nMicroblock: number;
    nAccountVb: number;
    nValidatorNodeVb: number;
    nOrganizationVb: number;
    nAppUserVb: number;
    nApplicationVb: number;
    nAppLedgerVb: number;
    nOracleVb: number;
}

export class ChainStatus {
    private status: ChainStatusInterface;

    constructor(status: ChainStatusInterface) {
        this.status = status;
    }

    getLastBlockHeight(): number {
        return this.status.lastBlockHeight;
    }

    getTimeToNextBlock(): number {
        return this.status.timeToNextBlock;
    }

    getSectionCount(): number {
        return this.status.nSection;
    }

    getMicroblockCount(): number {
        return this.status.nMicroblock;
    }

    getAccountVbCount(): number {
        return this.status.nAccountVb;
    }

    getValidatorNodeVbCount(): number {
        return this.status.nValidatorNodeVb;
    }

    getOrganizationVbCount(): number {
        return this.status.nOrganizationVb;
    }

    getAppUserVbCount(): number {
        return this.status.nAppUserVb;
    }

    getApplicationVbCount(): number {
        return this.status.nApplicationVb;
    }

    getAppLedgerVbCount(): number {
        return this.status.nAppLedgerVb;
    }

    getOracleVbCount(): number {
        return this.status.nOracleVb;
    }

    static build(data: ChainStatusInterface): ChainStatus {
        // Validate required properties
        if (
            typeof data.lastBlockHeight !== "number" ||
            typeof data.timeToNextBlock !== "number" ||
            typeof data.nSection !== "number" ||
            typeof data.nMicroblock !== "number" ||
            typeof data.nAccountVb !== "number" ||
            typeof data.nValidatorNodeVb !== "number" ||
            typeof data.nOrganizationVb !== "number" ||
            typeof data.nAppUserVb !== "number" ||
            typeof data.nApplicationVb !== "number" ||
            typeof data.nAppLedgerVb !== "number" ||
            typeof data.nOracleVb !== "number"
        ) {
            throw new Error("Invalid chain status data.");
        }

        // Create and return a new ChainStatus
        return new ChainStatus(data);
    }
}


export interface TokenTransactionInterface {
    height: number;
    previousHistoryHash: string;
    type: number;
    name: string;
    timestamp: Date;
    linkedAccount: string;
    amount: number;
    chainReference: {
        mbHash: string;
        sectionIndex: number;
    };
}

export class TokenTransaction {
    private transaction: TokenTransactionInterface;

    constructor(transaction: TokenTransactionInterface) {
        this.transaction = transaction;
    }

    getHeight(): number {
        return this.transaction.height;
    }

    getPreviousHistoryHash(): string {
        return this.transaction.previousHistoryHash;
    }

    isEmitter() {
        return (this.transaction.type & BK_PLUS) === 0;
    }

    getLabel(): string {
        return this.transaction.name;
    }

    getDate(): Date {
        return this.transaction.timestamp;
    }

    getLinkedAccount(): string {
        return this.transaction.linkedAccount;
    }

    getAmount(): number {
        return this.transaction.amount;
    }

    getMicroBlockContainingTransaction(): string {
        return this.transaction.chainReference.mbHash;
    }

    getSectionIntMicroBlockContainingTransaction(): number {
        return this.transaction.chainReference.sectionIndex;
    }

    static build(transactionData: TokenTransactionInterface): TokenTransaction {
        // Validate required properties
        if (
            typeof transactionData.height !== 'number' ||
            typeof transactionData.previousHistoryHash !== 'string' ||
            typeof transactionData.type !== 'number' ||
            typeof transactionData.name !== 'string' ||
            typeof transactionData.timestamp !== 'object' ||
            typeof transactionData.linkedAccount !== 'string' ||
            typeof transactionData.amount !== 'number' ||
            typeof transactionData.chainReference !== 'object' ||
            typeof transactionData.chainReference.mbHash !== 'string' ||
            typeof transactionData.chainReference.sectionIndex !== 'number'
        ) {
            throw new Error("Invalid token transaction data.");
        }

        // Create and return a new TokenTransaction
        return new TokenTransaction(transactionData);
    }
}

export interface FieldInterface {
    name: string;
    type: number;
    maskId?: number;
    structType?: number;
}

export enum FieldCategory {
    STRUCT = "struct",
    ENUM = "enum",
    PRIMITIVE = "primitive",
    ORACLE_ANSWER = "oracle_answer",
}

export class Field {
    private field: FieldInterface;


    static build(fieldJson: FieldInterface): Field {
        // Validate required properties from the JSON object
        if (!fieldJson.name || !fieldJson.type) {
            throw new Error("Invalid field JSON: 'name' and 'type' are required.");
        }

        // Construct object from the JSON
        const fieldDefinition: FieldInterface = {
            name: fieldJson.name,
            type: fieldJson.type,
            structType: fieldJson.structType,
            maskId: fieldJson.maskId
        };

        // Return a new Field instance
        return new Field(fieldDefinition);
    }

    constructor(field: FieldInterface) {
        this.field = field;
    }

    getName(): string {
        return this.field.name;
    }

    isPublic(): boolean {
        return !util.isPrivate(this.field.type);
    }

    isPrivate(): boolean {
        return !this.isPublic();
    }

    isRequired(): boolean {
        return !this.isOptional();
    }

    isOptional() : boolean {
        return util.isOptional(this.field.type);
    }

    isArray(): boolean {
        return util.isArray(this.field.type);
    }

    isHashable(): boolean {
        return util.isHashable(this.field.type);
    }

    isPrimitive(): boolean {
        // Implémentation basée sur le type
        return this.getFieldCategory() === FieldCategory.PRIMITIVE;
    }

    isStruct(): boolean {
        return this.getFieldCategory() === FieldCategory.STRUCT;
    }

    isEnum(): boolean {
        return this.getFieldCategory() === FieldCategory.ENUM;
    }

    isOracleAnswer(): boolean {
        return this.getFieldCategory() === FieldCategory.ORACLE_ANSWER;
    }

    hasMask(): boolean {
        return this.field.maskId !== undefined;
    }

    getMask(): number | undefined {
        return this.field.maskId;
    }

    getStructure(): number | undefined {
        return this.field.structType;
    }

    getFieldCategory(): FieldCategory {
        const type = this.field.type;
        if (util.isStruct(type)) {
            if (typeof this.field.structType !== 'number') throw new Error(`Invalid structure type: expecting one of [${constants.STRUCT_ORACLE}, ${constants.STRUCT_INTERNAL}]: got ${this.field.structType} `);
            const type = this.field.structType;
            if (type === constants.STRUCT_INTERNAL) return FieldCategory.STRUCT
            if (type === constants.STRUCT_ORACLE) return FieldCategory.ORACLE_ANSWER
        }
        if (util.isEnum(type)) return FieldCategory.ENUM;
        if (util.isPrimitive(type)) return FieldCategory.PRIMITIVE;
        throw new Error(`Undefined field type: ${type}`)
    }
}

export interface MaskInterface {
    name: string;
    regex: string;
    substitution: string;
}

export interface EnumerationInterface {
    name: string;
    values: string[];
}

export interface OracleAnswerInterface {
    oracle: string;
    version: number;
    serviceName: string;
}

export interface StructureInterface {
    name: string;
    properties: FieldInterface[];
}

export interface ApplicationMessageInterface {
    name: string;
    content: string;
}

export interface ApplicationDefinitionInterface {
    fields: FieldInterface[];
    internalStructures: StructureInterface[];
    oracleStructures: OracleAnswerInterface[];
    messages: ApplicationMessageInterface[];
    enumerations: EnumerationInterface[];
    masks: MaskInterface[];
}

export interface OracleServiceInterface {
    name: string;
    request: FieldInterface[];
    answer: FieldInterface[];
}


export class OracleService {
    constructor(
        private readonly name: string,
        private readonly request: Field[],
        private readonly answer: Field[]
    ) {
    }

    getName(): string {
        return this.name;
    }

    getRequest(): Field[] {
        return this.request;
    }

    getAnswer(): Field[] {
        return this.answer;
    }

    static build(data: OracleServiceInterface): OracleService {
        if (
            typeof data.name !== 'string' ||
            !Array.isArray(data.request) ||
            !Array.isArray(data.answer)
        ) {
            throw new Error('Invalid OracleServiceInterface structure');
        }

        const requestFields = data.request.map(field => new Field(field));
        const answerFields = data.answer.map(field => new Field(field));

        return new OracleService(data.name, requestFields, answerFields);
    }
}

export interface OracleDefinitionInterface {
    services: OracleServiceInterface[];
    internalStructures: StructureInterface[];
    enumerations: EnumerationInterface[];
    masks: MaskInterface[];
}


export class OracleDefinition {
    constructor(
        private readonly services: OracleService[],
        private readonly internalStructures: Structure[],
        private readonly enumerations: Enumeration[],
        private readonly masks: Mask[]
    ) {
    }

    getServices(): OracleService[] {
        return this.services;
    }

    getStructures(): Structure[] {
        return this.internalStructures;
    }

    getEnumerations(): Enumeration[] {
        return this.enumerations;
    }

    getMasks(): Mask[] {
        return this.masks;
    }

    /**
     * Get the total number of masks.
     */
    getNumberOfMasks(): number {
        return this.masks.length;
    }

    /**
     * Get the total number of enumerations.
     */
    getNumberOfEnumerations(): number {
        return this.enumerations.length;
    }

    /**
     * Get the total number of services.
     */
    getNumberOfServices(): number {
        return this.services.length;
    }

    /**
     * Get the total number of structures.
     */
    getNumberOfStructures(): number {
        return this.internalStructures.length;
    }
    
    
    static build(data: OracleDefinitionInterface): OracleDefinition {
        if (
            !Array.isArray(data.services) ||
            !Array.isArray(data.internalStructures) ||
            !Array.isArray(data.enumerations) ||
            !Array.isArray(data.masks)
        ) {
            throw new Error('Invalid OracleDefinitionInterface structure');
        }

        const services = data.services.map(service => OracleService.build(service));
        const internalStructures = data.internalStructures.map(struct => Structure.build(struct));
        const enumerations = data.enumerations.map(enumData => Enumeration.build(enumData));
        const masks = data.masks.map(maskData => Mask.build(maskData));

        return new OracleDefinition(services, internalStructures, enumerations, masks);
    }
}



export interface ApplicationVersionInterface {
    version: number;
    definition: ApplicationDefinitionInterface;
}

export interface ApplicationDescriptionInterface {
    name: string;
    logoUrl: string;
    homepageUrl: string;
    rootDomain: string;
    description: string;
}


export class ApplicationDescription {
    constructor(
        private readonly name: string,
        private readonly logoUrl: string,
        private readonly homepageUrl: string,
        private readonly rootDomain: string,
        private readonly description: string
    ) {
    }

    getName(): string {
        return this.name;
    }

    getLogoUrl(): string {
        return this.logoUrl;
    }

    getHomepageUrl(): string {
        return this.homepageUrl;
    }

    getRootDomain(): string {
        return this.rootDomain;
    }

    getDescription(): string {
        return this.description;
    }

    static build(data: ApplicationDescriptionInterface): ApplicationDescription {
        if (
            typeof data.name !== 'string' ||
            typeof data.logoUrl !== 'string' ||
            typeof data.homepageUrl !== 'string' ||
            typeof data.rootDomain !== 'string' ||
            typeof data.description !== 'string'
        ) {
            throw new Error('Invalid ApplicationDescriptionInterface structure');
        }
        return new ApplicationDescription(
            data.name,
            data.logoUrl,
            data.homepageUrl,
            data.rootDomain,
            data.description
        );
    }
}

export class Mask {
    constructor(
        private readonly name: string,
        private readonly regex: string,
        private readonly substitution: string
    ) {
    }

    getName(): string {
        return this.name;
    }

    getRegex(): string {
        return this.regex;
    }

    getSubstitution(): string {
        return this.substitution;
    }

    static build(data: MaskInterface): Mask {
        if (
            typeof data.name !== 'string' ||
            typeof data.regex !== 'string' ||
            typeof data.substitution !== 'string'
        ) {
            throw new Error('Invalid MaskInterface structure');
        }
        return new Mask(data.name, data.regex, data.substitution);
    }
}

export class Enumeration {
    constructor(
        private readonly name: string,
        private readonly values: string[]
    ) {
    }

    getName(): string {
        return this.name;
    }

    getValues(): string[] {
        return this.values;
    }

    static build(data: EnumerationInterface): Enumeration {
        if (typeof data.name !== 'string' || !Array.isArray(data.values)) {
            throw new Error('Invalid EnumerationInterface structure');
        }
        return new Enumeration(data.name, data.values);
    }
}

export class OracleAnswer {
    constructor(
        private readonly oracle: string,
        private readonly version: number,
        private readonly serviceName: string
    ) {
    }

    getOracle(): string {
        return this.oracle;
    }

    getVersion(): number {
        return this.version;
    }

    getServiceName(): string {
        return this.serviceName;
    }

    static build(data: OracleAnswerInterface): OracleAnswer {
        if (
            typeof data.oracle !== 'string' ||
            typeof data.version !== 'number' ||
            typeof data.serviceName !== 'string'
        ) {
            throw new Error('Invalid OracleAnswerInterface structure');
        }
        return new OracleAnswer(data.oracle, data.version, data.serviceName);
    }
}

export class ApplicationMessage {
    constructor(
        private readonly name: string,
        private readonly content: string
    ) {
    }

    getName(): string {
        return this.name;
    }

    getContent(): string {
        return this.content;
    }

    static build(data: ApplicationMessageInterface): ApplicationMessage {
        if (
            typeof data.name !== 'string' ||
            typeof data.content !== 'string'
        ) {
            throw new Error('Invalid ApplicationMessageInterface structure');
        }
        return new ApplicationMessage(data.name, data.content);
    }
}


export class Structure {
    constructor(
        private readonly name: string,
        private readonly properties: Field[]
    ) {
    }

    getName(): string {
        return this.name;
    }

    getProperties(): Field[] {
        return this.properties;
    }

    static build(data: StructureInterface): Structure {
        if (
            typeof data.name !== 'string' ||
            !Array.isArray(data.properties)
        ) {
            throw new Error('Invalid StructureInterface structure');
        }

        return new Structure(
            data.name,
            data.properties.map((property) => Field.build(property))
        );
    }
}




export class ApplicationDefinition {
    constructor(
        private readonly fields: Field[],
        private readonly internalStructures: Structure[],
        private readonly oracleStructures: OracleAnswer[],
        private readonly messages: ApplicationMessage[],
        private readonly enumerations: Enumeration[],
        private readonly masks: Mask[]
    ) {
    }

    getFields(): Field[] {
        return this.fields;
    }

    getInternalStructures(): Structure[] {
        return this.internalStructures;
    }

    getOracleStructures(): OracleAnswer[] {
        return this.oracleStructures;
    }

    getMessages(): ApplicationMessage[] {
        return this.messages;
    }

    getEnumerations(): Enumeration[] {
        return this.enumerations;
    }

    getMasks(): Mask[] {
        return this.masks;
    }

    static build(data: ApplicationDefinitionInterface): ApplicationDefinition {
        if (
            !Array.isArray(data.fields) ||
            !Array.isArray(data.internalStructures) ||
            !Array.isArray(data.oracleStructures) ||
            !Array.isArray(data.messages) ||
            !Array.isArray(data.enumerations) ||
            !Array.isArray(data.masks)
        ) {
            throw new Error('Invalid ApplicationDefinitionInterface structure');
        }

        return new ApplicationDefinition(
            data.fields.map((field) => Field.build(field)),
            data.internalStructures.map((structure) =>
                Structure.build(structure)
            ),
            data.oracleStructures.map((oracleAnswer) =>
                OracleAnswer.build(oracleAnswer)
            ),
            data.messages.map((message) => ApplicationMessage.build(message)),
            data.enumerations.map((enumeration) => Enumeration.build(enumeration)),
            data.masks.map((mask) => Mask.build(mask))
        );
    }
}

export interface MicroBlockContentInterface {
    header: {
        magicString: string;
        protocolVersion: number;
        height: number;
        previousHash: string;
        timestamp: number;
        gas: number;
        gasPrice: number;
    };
    sections: {
        id: number;
        label: string;
        size: number;
    }[];
}




export interface MasterBlockInfoInterface {
    height: number;
    status: number;
    hash: string;
    timestamp: number;
    proposerNode: string;
    size: number;
    nMicroblock: number;
}

export class MasterBlockInfo {
    constructor(
        private readonly height: number,
        private readonly status: number,
        private readonly hash: string,
        private readonly timestamp: number,
        private readonly proposerNode: string,
        private readonly size: number,
        private readonly nMicroblock: number
    ) {
    }

    public getHeight(): number {
        return this.height;
    }

    public isAnchored(): boolean {
        return this.status === 0;
    }

    public getHash(): string {
        return this.hash;
    }

    public getTimestamp(): number {
        return this.timestamp * 1000;
    }


    public getProposedAt() : Date {
        return new Date(this.getTimestamp())
    }
    public getProposerNode(): string {
        return this.proposerNode;
    }

    public getSize(): number {
        return this.size;
    }

    public getNumberOfMicroblocks(): number {
        return this.nMicroblock;
    }

    /**
     * Builds a new MasterBlockInfo instance from a MasterBlockInfoInterface object.
     * Validates the input structure before instantiation.
     *
     * @param data The input object implementing MasterBlockInfoInterface.
     * @returns A new MasterBlockInfo instance based on the input data.
     * @throws {Error} If the input data does not match the required structure.
     */
    static build(data: MasterBlockInfoInterface): MasterBlockInfo {
        if (
            typeof data.height !== 'number' ||
            typeof data.status !== 'number' ||
            typeof data.hash !== 'string' ||
            typeof data.timestamp !== 'number' ||
            typeof data.proposerNode !== 'string' ||
            typeof data.size !== 'number' ||
            typeof data.nMicroblock !== 'number'
        ) {
            throw new Error('Invalid MasterBlockInfoInterface structure');
        }

        return new MasterBlockInfo(
            data.height,
            data.status,
            data.hash,
            data.timestamp,
            data.proposerNode,
            data.size,
            data.nMicroblock
        );
    }
}


/**
 * Interface representing the structure of MasterBlockContent.
 */
export interface MasterBlockContentInterface {
    timestamp: number;
    proposerNode: string;
    previousHash: string;
    height: number;
    merkleRootHash: string;
    radixRootHash: string;
    chainId: string;
    microblocks: {
        hash: string;
        vbHash: string;
        vbType: number;
        height: number;
        size: number;
        nSection: number;
    }[];
}

/**
 * Represents the MasterBlockContent class providing functionalities to interact with
 * the master block content since its creation.
 */
export class MasterBlockContent {
    constructor(
        private readonly timestamp: number,
        private readonly proposerNode: string,
        private readonly previousHash: string,
        private readonly height: number,
        private readonly merkleRootHash: string,
        private readonly radixRootHash: string,
        private readonly chainId: string,
        private readonly microblocks: {
            hash: string;
            vbHash: string;
            vbType: number;
            height: number;
            size: number;
            nSection: number;
        }[]
    ) {
    }

    public getTimestamp(): number {
        return this.timestamp * 1000;
    }

    public getProposerNode(): string {
        return this.proposerNode;
    }

    public getPreviousHash(): string {
        return this.previousHash;
    }

    public getHeight(): number {
        return this.height;
    }

    public getMerkleRootHash(): string {
        return this.merkleRootHash;
    }

    public getRadixRootHash(): string {
        return this.radixRootHash;
    }

    public getChainId(): string {
        return this.chainId;
    }

    public getNumberOfMicroblocks(): number {
        return this.microblocks.length;
    }

    public getMicroBlocksHash(): string[] {
        return this.microblocks.map(mb => mb.hash);
    }


    /**
     * Builds a new MasterBlockContent instance from a MasterBlockContentInterface object.
     * Validates the input structure before instantiation.
     *
     * @param data The input object implementing MasterBlockContentInterface.
     * @returns A new MasterBlockContent instance based on the input data.
     * @throws {Error} If the input data does not match the required structure.
     */
    static build(data: MasterBlockContentInterface): MasterBlockContent {
        if (
            typeof data.timestamp !== 'number' ||
            typeof data.proposerNode !== 'string' ||
            typeof data.previousHash !== 'string' ||
            typeof data.height !== 'number' ||
            typeof data.merkleRootHash !== 'string' ||
            typeof data.radixRootHash !== 'string' ||
            typeof data.chainId !== 'string' ||
            !Array.isArray(data.microblocks) ||
            data.microblocks.some(
                (microblock) =>
                    typeof microblock.hash !== 'string' ||
                    typeof microblock.vbHash !== 'string' ||
                    typeof microblock.vbType !== 'number' ||
                    typeof microblock.height !== 'number' ||
                    typeof microblock.size !== 'number' ||
                    typeof microblock.nSection !== 'number'
            )
        ) {
            throw new Error('Invalid MasterBlockContentInterface structure');
        }

        return new MasterBlockContent(
            data.timestamp,
            data.proposerNode,
            data.previousHash,
            data.height,
            data.merkleRootHash,
            data.radixRootHash,
            data.chainId,
            data.microblocks
        );
    }
}

/**
 * Represents the interface for a section object.
 *
 * This interface defines the structure of a section
 * with its unique identifier, label, and size properties.
 *
 * Properties:
 * - id: A unique numeric identifier for the section.
 * - label: A descriptive string representing the name of the section.
 * - size: A numeric value specifying the size of the section.
 */
export interface SectionInterface {
    id: number;
    label: string;
    size: number;
}

export class Section {

    constructor(
        private readonly id: number,
        private readonly label: string,
        private readonly size: number
    ) {
    }

    public getId(): number {
        return this.id;
    }

    public getLabel(): string {
        return this.label;
    }

    public getSize(): number {
        return this.size;
    }

    /**
     * Creates a new instance of the `Section` class based on the given `SectionInterface` input data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {SectionInterface} data - The input object containing the id, label, and size for the `Section`.
     * @param {number} data.id - The unique identifier of the section.
     * @param {string} data.label - The descriptive label of the section.
     * @param {number} data.size - The size of the section.
     *
     * @return {Section} The `Section` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `SectionInterface`.
     */
    static build(data: SectionInterface): Section {
        if (
            typeof data.id !== 'number' ||
            typeof data.label !== 'string' ||
            typeof data.size !== 'number'
        ) {
            throw new Error('Invalid SectionInterface structure');
        }

        return new Section(data.id, data.label, data.size);
    }
}

export class MicroBlock {
    constructor(
        private readonly header: {
            magicString: string;
            protocolVersion: number;
            height: number;
            previousHash: string;
            timestamp: number;
            gas: number;
            gasPrice: number;
        },
        private readonly sections: {
            id: number;
            label: string;
            size: number;
        }[]
    ) {
    }


    public getHeight(): number {
        return this.header.height;
    }

    public getPreviousHash(): string {
        return this.header.previousHash;
    }

    getTimestamp(): number {
        return this.header.timestamp * 1000;
    }

    getDate(): Date {
        return new Date(this.header.timestamp * 1000);
    }

    getGas(): number {
        return this.header.gas;
    }

    getGasPrice(): number {
        return this.header.gasPrice;
    }

    getSections(): Section[] {
        return this.sections.map(Section.build)
    }

    getNumberOfSections(): number {
        return this.sections.length;
    }

    getSectionId(index: number): number {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].id;
    }

    getSectionLabel(index: number): string {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].label;
    }

    getSectionSize(index: number): number {
        if (index < 0 || index >= this.sections.length) {
            throw new Error('Section index out of bounds');
        }
        return this.sections[index].size;
    }

    /**
     * Constructs a new instance of the `MicroBlock` class based on the provided `MicroBlockContentInterface` data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {MicroBlockContentInterface} data - The input object containing the header and sections information for the `MicroBlock`.
     * @param {Object} data.header - The header information of the MicroBlock.
     * @param {string} data.header.magicString - The magic string identifying the block.
     * @param {number} data.header.protocolVersion - The protocol version of the block.
     * @param {number} data.header.height - The height of the block in the chain.
     * @param {string} data.header.previousHash - The hash of the previous block in the chain.
     * @param {number} data.header.timestamp - The timestamp signifying when the block was created.
     * @param {number} data.header.gas - The total gas used within the block.
     * @param {number} data.header.gasPrice - The gas price at the time of block creation.
     * @param {Array} data.sections - An array containing section objects of the MicroBlock.
     * @param {number} data.sections[].id - The unique identifier of each section in the block.
     * @param {string} data.sections[].label - The descriptive label of each section.
     * @param {number} data.sections[].size - The size of each section in the block.
     *
     * @return {MicroBlock} The `MicroBlock` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `MicroBlockContentInterface`.
     */
    static build(data: MicroBlockContentInterface): MicroBlock {
        if (
            typeof data.header !== 'object' ||
            typeof data.header.magicString !== 'string' ||
            typeof data.header.protocolVersion !== 'number' ||
            typeof data.header.height !== 'number' ||
            typeof data.header.previousHash !== 'string' ||
            typeof data.header.timestamp !== 'number' ||
            typeof data.header.gas !== 'number' ||
            typeof data.header.gasPrice !== 'number' ||
            !Array.isArray(data.sections) ||
            !data.sections.every(
                (section) =>
                    typeof section.id === 'number' &&
                    typeof section.label === 'string' &&
                    typeof section.size === 'number'
            )
        ) {
            throw new Error('Invalid MicroBlockContentInterface structure');
        }

        return new MicroBlock(data.header, data.sections);
    }
}


export interface OrganisationDescriptionInterface {
    publicKey: string;
    name: string;
    city: string;
    countryCode: string;
    website: string;
}

export class OrganisationDescription {
    constructor(
        private readonly name: string,
        private readonly city: string,
        private readonly countryCode: string,
        private readonly website: string,
        private readonly publicKey: string,
    ) {
    }

    public getName(): string {
        return this.name;
    }

    public getCity(): string {
        return this.city;
    }

    public getCountryCode(): string {
        return this.countryCode;
    }

    public getWebsite(): string {
        return this.website;
    }

    public getFormattedLocation(): string {
        return `${this.city} (${this.countryCode})`
    }

    public getPublicKey(): string {
        return this.publicKey
    }

    /**
     * Creates a new instance of the `OrganisationDescription` class based on the given `OrganisationDescriptionInterface` input data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {OrganisationDescriptionInterface} data - The input object containing the name, city, countryCode, and website of the organisation.
     * @param {string} data.publicKey - The public key of the organisation.
     * @param {string} data.name - The name of the organisation.
     * @param {string} data.city - The city where the organisation is located.
     * @param {string} data.countryCode - The country code of the organisation's location.
     * @param {string} data.website - The website of the organisation.
     *
     * @return {OrganisationDescription} The `OrganisationDescription` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `OrganisationDescriptionInterface`.
     */
    static build(data: OrganisationDescriptionInterface): OrganisationDescription {
        if (
            typeof data.publicKey !== 'string' ||
            typeof data.name !== 'string' ||
            typeof data.city !== 'string' ||
            typeof data.countryCode !== 'string' ||
            typeof data.website !== 'string'
        ) {
            throw new Error('Invalid OrganisationDescriptionInterface structure');
        }

        return new OrganisationDescription(data.name, data.city, data.countryCode, data.website, data.publicKey);
    }
}


export interface AccountStateInterface {
    height: number;
    balance: number;
    lastHistoryHash: string;
}

export class AccountState {
    constructor(
        private readonly height: number,
        private readonly balance: number,
        private readonly lastHistoryHash: string,
    ) {
    }

    public getHeight(): number {
        return this.height;
    }

    public getBalance(): number {
        return this.balance;
    }

    public getLastHistoryHash(): string {
        return this.lastHistoryHash;
    }

    /**
     * Creates a new instance of the `AccountState` class based on the given `AccountStateInterface` input data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {AccountStateInterface} data - The input object containing the height, balance, and lastHistoryHash of the account state.
     * @param {number} data.height - The height of the account state.
     * @param {number} data.balance - The balance of the account.
     * @param {string} data.lastHistoryHash - The last history hash of the account.
     *
     * @return {AccountState} The `AccountState` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `AccountStateInterface`.
     */
    static build(data: AccountStateInterface): AccountState {
        if (
            typeof data.height !== 'number' ||
            typeof data.balance !== 'number' ||
            typeof data.lastHistoryHash !== 'string'
        ) {
            throw new Error('Invalid AccountStateInterface structure');
        }

        return new AccountState(data.height, data.balance, data.lastHistoryHash);
    }
}


export interface OracleDescriptionInterface {
    name: string;
}

export class OracleDescription {
    constructor(private readonly name: string) {
    }

    public getName(): string {
        return this.name;
    }

    /**
     * Creates a new instance of the `OracleDescription` class based on the given `OracleDescriptionInterface` input data.
     * Validates the structure of the input data before instantiation.
     *
     * @param {OracleDescriptionInterface} data - The input object containing the name of the oracle.
     * @param {string} data.name - The name of the oracle.
     *
     * @return {OracleDescription} The `OracleDescription` instance built from the validated input data.
     * @throws {Error} If `data` does not match the expected structure of `OracleDescriptionInterface`.
     */
    static build(data: OracleDescriptionInterface): OracleDescription {
        if (typeof data.name !== 'string') {
            throw new Error('Invalid OracleDescriptionInterface structure');
        }

        return new OracleDescription(data.name);
    }
}

