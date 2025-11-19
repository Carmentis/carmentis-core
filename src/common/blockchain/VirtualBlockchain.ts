import {CHAIN} from "../constants/constants";
import {Microblock, Section} from "./Microblock";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {
    IllegalStateError,
    InternalError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError,
    VirtualBlockchainNotFoundError
} from "../errors/carmentis-error";
import {SectionType} from "../entities/SectionType";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {IMicroblockStructureChecker} from "../blockchainV2/structureChekers/IMicroblockStructureChecker";
import {EncoderFactory} from "../utils/encoder";

/**
 * Abstract class representing a Virtual Blockchain (VB).
 * A Virtual Blockchain is a construct that consists of microblocks at specific heights, allowing for the creation and
 * management of a blockchain-like structure. This class includes core functionalities such as loading VB states, managing microblocks,
 * and configuring expiration settings.
 *
 * This class is intended to be subclassed to implement specific behavior for varied virtual blockchain types.
 */
export abstract class VirtualBlockchain {
    public static INITIAL_HEIGHT = 1;

    private height: number;
    private identifier: Uint8Array | undefined;
    private microblockHashes: Uint8Array[];
    provider: Provider;
    private type: number;
    private expirationDay: number;
    private microblockStructureChecker: IMicroblockStructureChecker;

    constructor(provider: Provider, type: VirtualBlockchainType, microblockStructureChecker: IMicroblockStructureChecker) {
        this.microblockStructureChecker = microblockStructureChecker;
        this.provider = provider;
        //this.sectionCallbacks = new Map;
        this.microblockHashes = [];
        //this.currentMicroblock = null;
        this.type = type;
        this.expirationDay = 0;
        this.height = 0;
    }



    /**
     * Synchronizes the virtual blockchain state from the provider using the given virtual blockchain identifier.
     *
     * @param {Hash} vbId - The identifier of the virtual blockchain to be synchronized.
     * @return {Promise<void>} Resolves when the virtual blockchain has been successfully synchronized.
     *                         Throws an error if the virtual blockchain is not found or if the blockchain type is invalid.
     */
    protected async synchronizeVirtualBlockchainFromProvider(vbId: Hash) {
        const identifier = vbId.toBytes()
        const content = await this.provider.getVirtualBlockchainContent(identifier);
        if (content === null || content.state === undefined) {
            throw new VirtualBlockchainNotFoundError(vbId);
        }
        // the type is already assigned when creating the virtual blockchain
        if (content.state.type !== this.type) throw new Error("Invalid blockchain type loaded");


        this.identifier = identifier;
        this.height = content.state.height;
        this.expirationDay = content.state.expirationDay;
        this.microblockHashes = content.microblockHashes;
    }

    setExpirationDay(day: number) {
        if(this.height) {
            throw new Error("The expiration day cannot be changed anymore.");
        }
        this.expirationDay = day;
    }

    /*
    getState(): CustomState {
        if (!this.state) {
            this.state = this.getInitialState();
        }
        return this.state;
    }

    protected getInitialState(): CustomState {
        throw new Error("State is undefined and no initial state has been defined.");
    }

     */

    /**
     * Retrieves the genesis seed by extracting it from the previous hash of the first microblock.
     *
     * @return {Promise<Hash>} A promise that resolves to the genesis seed derived from the microblock's previous hash.
     */
    async getGenesisSeed() {
        const mb = await this.getFirstMicroBlock();
        // TODO(correctness): check because the genesisseed is a *part* of the previousHash (also includes type and expirationDate)
        return Hash.from(mb.header.previousHash);
    }

    /**
     * Retrieves the height value.
     *
     * @return {number} The current height.
     */
    getHeight(): number {
        return this.height;
    }

    /**
     * Retrieves the identifier associated with the current instance.
     *
     * @return {Uint8Array} The unique identifier of the instance.
     */
    getId(): Uint8Array {
        return this.identifier!
    }

    /**
     * Checks whether the virtual blockchain identifier is defined.
     *
     * @return {boolean} True if the virtual blockchain identifier is defined, otherwise false.
     */
    isVirtualBlockchainIdDefined(): boolean {
        return this.identifier instanceof Uint8Array;
    }

    //abstract checkMicroblockStructure(microblock: any): void;

    /**
     Registers a callback for a given section type.
     */
    registerSectionCallback<T = any>(
        sectionType: SectionType,
        callback: (mb: Microblock, section: Section<T>) => void | Promise<void>
    ) {
        //this.sectionCallbacks.set(sectionType, callback.bind(this));
    }



    /*
    async importMicroblock(headerData: Uint8Array, bodyData: Uint8Array) {
        this.currentMicroblock = new Microblock(this.type);
        this.currentMicroblock.load(headerData, bodyData);
        this.checkMicroblockStructure(this.currentMicroblock);

        for(const section of this.currentMicroblock.sections) {
            await this.processSectionCallback(this.currentMicroblock, section);
        }

        this.height++;

        if(this.currentMicroblock.header.height == 1) {
            this.identifier = this.currentMicroblock.hash;
        }

        return this.currentMicroblock.hash;
    }

     */

    /**
     * Retrieves the first microblock.
     *
     * @return {Promise<Microblock>} A promise that resolves to the first microblock data.
     */
    async getFirstMicroBlock() {
        return this.getMicroblock(1);
    }


    /**
     * Retrieves the microblock based on the given height.
     *
     * @param {number} height - The height of the microblock to retrieve.
     * @return {Promise<Microblock>} A promise that resolves to the requested Microblock instance.
     * @throws {MicroBlockNotFoundInVirtualBlockchainAtHeightError} If the microblock is not found at the specified height.
     * @throws {Error} If the microblock information cannot be loaded.
     */
    async getMicroblock(height: number): Promise<Microblock> {
        // retrieve the hash of the microblock from its height
        const hash = this.microblockHashes[height - 1];
        if (!(hash instanceof Uint8Array)) {
            throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(this.getIdentifier(), height);
        }

        // load the content of the microblock from the provider
        const info = await this.provider.getMicroblockInformation(hash);
        if (info === null) {
            const encoder = EncoderFactory.bytesToBase64Encoder();
            throw new Error(`Unable to load microblock information from hash ${encoder.encode(hash)} (height ${height})`);
        }

        const bodyList = await this.provider.getMicroblockBodys([ hash ]);
        const serializedHeader = info.header;
        const serializedBody = bodyList[0].body;
        const microblock = Microblock.loadFromSerializedHeaderAndBody(this.type, serializedHeader, serializedBody )
        //const microblock = new Microblock(this.type);
        //microblock.load(info.header, bodyList[0].body);

        return microblock;
    }

    /**
     * Retrieves the identifier of the virtual blockchain.
     * Throws an error if the identifier is undefined.
     *
     * @return {Hash} The hash representation of the virtual blockchain identifier.
     */
    getIdentifier(): Hash {
        if (this.identifier === undefined) throw new TypeError(`Got undefined virtual blockchain identifier`)
        return Hash.from(this.identifier);
    }

    /**
     * Checks whether the structure is empty.
     *
     * @return {boolean} Returns true if the structure has no height, otherwise false.
     */
    isEmpty(): boolean {
        return this.getHeight() === 0;
    }


    /**
     * Appends a microblock to the current structure, updating the identifier and height if necessary.
     *
     * @param {Microblock} microblock - The microblock to append.
     * @return {Promise<void>} A promise that resolves once the microblock is appended and the local state is updated.
     */
    async appendMicroBlock(microblock: Microblock) {
        // if the current state of the vb is empty (no microblock), then update the identifier
        if (this.isEmpty()) {
            this.identifier = microblock.getHash();
        }


        // we increase the height of the vb
        this.height += 1;

        // TODO update the previous hash of the microblock if possible
        await this.updateLocalState(microblock);
    }

    /**
     * Retrieves the type of the current instance.
     *
     * @return {string} The type of the instance.
     */
    getType() {
        return this.type;
    }

    /**
     * Updates the local state with the provided microblock.
     *
     * @param {Microblock} microblock - The microblock object containing the data to update the local state.
     * @return {Promise<void>} A promise that resolves when the local state has been successfully updated.
     */
    protected abstract updateLocalState(microblock: Microblock): Promise<void>;

    /*
    startMicroBlockConstruction() {
        const isBuildingGenesisMicroBlock = this.height === 0;
        this.currentMicroblock = new Microblock(this.type);
        const previousHash = this.height ? this.microblockHashes[this.height - 1] : null;
        this.height++;
        this.currentMicroblock.create(this.height, previousHash, this.expirationDay);
        return { isBuildingGenesisMicroBlock }
    }

     */

    /*
    async addSection(type: SectionType, object: any) {
        if (!this.currentMicroblock) {
            this.startMicroBlockConstruction();
        }
        if (!this.currentMicroblock) throw new Error("Current micro-block has not been created")
        const section = this.currentMicroblock.addSection(type, object);
        await this.processSectionCallback(this.currentMicroblock, section);
    }

     */

    /*
    async processSectionCallback(microblock: Microblock, section: Section) {
        const callback = this.sectionCallbacks.get(section.type);
        if(callback) {
            await callback(microblock, section);
        }
    }

     */


    /*
    createSignature(privateKey: PrivateSignatureKey, withGas = true) : { signature: Uint8Array } {
        if (!this.currentMicroblock) throw new Error(
            "Cannot create a signature for a microblock that has not been created yet."
        )
        const signature = this.currentMicroblock.createSignature(privateKey, withGas);
        return { signature };
    }

     */
    /*
    setGasPrice(gasPrice: CMTSToken) {
        if (!this.currentMicroblock) throw new Error("Cannot set gas price on a microblock that has not been created yet.");
        this.currentMicroblock.gasPrice = gasPrice.getAmountAsAtomic();
    }

     */

    /*
    getMicroblockData() {
        if(!this.currentMicroblock) throw new Error("Cannot get the data of a microblock that has not been created yet.");

        this.checkMicroblockStructure(this.currentMicroblock);

        const { headerData, bodyData } = this.currentMicroblock.serialize();

        return Utils.binaryFrom(headerData, bodyData);
    }

     */

    /*
    async publish(waitForAnchoring: boolean) {
        if (!this.currentMicroblock) throw new InternalError("Cannot publish a microblock that has not been created yet.");

        this.checkMicroblockStructure(this.currentMicroblock);

        const { microblockHash, headerData, bodyData } = this.currentMicroblock.serialize();

        this.microblockHashes[this.height - 1] = microblockHash;

        if(this.height == 1) {
            this.identifier = microblockHash;
        }

        await this.provider.sendMicroblock(headerData, bodyData);

        if(waitForAnchoring) {
            await this.provider.awaitMicroblockAnchoring(microblockHash);
        }

        return Hash.from(microblockHash);
    }

     */



}
