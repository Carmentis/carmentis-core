import {Microblock} from "../microblock/Microblock";
import {Provider} from "../../providers/Provider";
import {Hash} from "../../entities/Hash";
import {IllegalParameterError, MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/SectionType";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {IMicroblockStructureChecker} from "../structureCheckers/IMicroblockStructureChecker";
import {EncoderFactory} from "../../utils/encoder";
import {Section} from "../../type/Section";
import {IMicroblockSearchFailureFallback} from "./fallbacks/IMicroblockSearchFailureFallback";
import {ThrownErrorMicroblockSearchFailureFallback} from "./fallbacks/ThrownErrorMicroblockSearchFailureFallback";
import {Height} from "../../type/Height";
import {BlockchainSerializer} from "../../data/BlockchainSerializer";
import {Logger} from "../../utils/Logger";
import {IProvider} from "../../providers/IProvider";
import {OnMicroblockInsertionEventListener} from "./events/OnMicroblockInsertedEventListener";

/**
 * Abstract class representing a Virtual Blockchain (VB).
 * A Virtual Blockchain is a construct that consists of microblocks at specific heights, allowing for the creation and
 * management of a blockchain-like structure. This class includes core functionalities such as loading VB states, managing microblocks,
 * and configuring expiration settings.
 *
 * This class is intended to be subclassed to implement specific behavior for varied virtual blockchain types.
 */
export abstract class VirtualBlockchain<LocalState = unknown> {
    public static INITIAL_HEIGHT = 1;
    private static logger = Logger.getVirtualBlockchainLogger();

    protected localState: LocalState;
    private height: number;
    private identifier: Uint8Array | undefined;

    /**
     * Represents a mapping between block heights and their corresponding microblock hashes.
     * The height is represented as a key, and for each height, the value is the microblock hash
     * in the form of a Uint8Array.
     *
     * This map is used to store and retrieve microblock hashes efficiently by their associated heights.
     * It provides a mechanism to maintain and reference the relationship between a blockchain height
     * and its microblock hash.
     */
    private microblockHashByHeight: Map<Height, Uint8Array>;

    /**
     * A Map that associates block heights with corresponding Microblocks.
     *
     * The `microblockByHeight` variable is used to efficiently retrieve
     * a Microblock based on its height in the blockchain. The key represents
     * the height of the block in the blockchain, where the height is a unique
     * identifier for the relative position of a block. The value is the Microblock
     * found at the specified height.
     */
    private microblockByHeight: Map<Height, Microblock>;

    protected provider: IProvider;
    private type: number;
    private expirationDay: number;

    /**
     * A fallback mechanism for handling microblock retrieval failures.
     * @private
     */
    private microblockSearchFailureFallback: IMicroblockSearchFailureFallback;

    private onMicroblockInsertionEventListeners: OnMicroblockInsertionEventListener[] = [];

    constructor(
        provider: IProvider,
        type: VirtualBlockchainType,
        localState: LocalState,
    ) {
        this.localState = localState;
        this.provider = provider;
        this.microblockHashByHeight = new Map();
        this.microblockByHeight = new Map<Height, Microblock>();
        this.type = type;
        this.expirationDay = 0;
        this.height = 0;
        this.microblockSearchFailureFallback = new ThrownErrorMicroblockSearchFailureFallback();
    }

    addOnMicroblockInsertionEventListener(listener: OnMicroblockInsertionEventListener) {
        this.onMicroblockInsertionEventListeners.push(listener);
    }

    /**
     * Validates the structure of the provided microblock to ensure it adheres to the expected format or constraints.
     *
     * @param {Microblock} microblock - The microblock object to be validated.
     * @return {boolean} Returns true if the microblock structure is valid; otherwise, returns false.
     */
    protected abstract checkMicroblockStructure(microblock: Microblock): boolean;

    /**
     * Updates the local state with information from the provided microblock.
     *
     * @param {LocalState} state - The current local state that needs to be updated.
     * @param {Microblock} microblock - The microblock containing new data to update the local state.
     * @return {Promise<LocalState>} A promise that resolves to the updated local state.
     */
    protected abstract updateLocalState(state: LocalState, microblock: Microblock): Promise<LocalState>;

    /**
     * Retrieves the local state of the current instance.
     *
     * @return {LocalState} The local state associated with this instance.
     */
    getLocalState(): LocalState {
        return this.localState;
    }

    /**
     * Updates the local state of the component.
     *
     * @param {LocalState} localState - The new local state object to be set.
     * @return {void} Does not return a value.
     */
    setLocalState(localState: LocalState): void {
        this.localState = localState;
    };

    /**
     * This method returns a new microblock which extends the virtual blockchain state.
     *
     * The returned microblock is not added to the list of microblocks contained in the virtual blockchain
     * but is updated to match the current state of the virtual blockchain.
     *
     * When the virtual blockchain is empty, the returned microblock is a genesis one.
     */
    async createMicroblock() {
        // easy case where the virtual blockchain is empty: we create and return a new microblock
        if (this.isEmpty()) return new Microblock(this.type)

        // otherwise, we have to create a new microblock and update its state to match the current state
        // of the virtual blockchain.
        const lastMicroblock = await this.getLastMicroblock();
        const extendingMicroblock = new Microblock(this.type);
        extendingMicroblock.setPreviousHash(lastMicroblock.getHash());
        extendingMicroblock.setHeight(this.getHeight() + 1);
        return extendingMicroblock;
    }

    getLastMicroblock(): Promise<Microblock> {
        return this.getMicroblock(this.getHeight())
    }
    

    setHeight(height: number) {
        this.height = height;
    }

    setIdentifier(identifier: Uint8Array) {
        this.identifier = identifier;
    }

    setMicroblockHashes(microblockHashes: Uint8Array[]) {
        let currentHeight = 1;
        for (const hash of microblockHashes) {
            this.microblockHashByHeight.set(currentHeight, hash);
            currentHeight++;
        }
    }

    setExpirationDay(day: number) {
        if(this.height > 1) {
            throw new Error("The expiration day cannot be changed anymore.");
        }
        this.expirationDay = day;
    }


    /**
     * Retrieves the genesis seed by extracting it from the previous hash of the first microblock.
     *
     * @return {Promise<Hash>} A promise that resolves to the genesis seed derived from the microblock's previous hash.
     */
    async getGenesisSeed() {
        const mb = await this.getFirstMicroBlock();
        // TODO(correctness): check because the genesisseed is a *part* of the previousHash (also includes type and expirationDate)
        return mb.getPreviousHash();
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
     * @param {Height} height - The height of the microblock to retrieve.
     * @return {Promise<Microblock>} A promise that resolves to the requested Microblock instance.
     * @throws {MicroBlockNotFoundInVirtualBlockchainAtHeightError} If the microblock is not found at the specified height.
     * @throws {Error} If the microblock information cannot be loaded.
     */
    async getMicroblock(height: Height): Promise<Microblock> {
        // if the provided height is strictly lower then we raise an error
        if (height < 1) throw new IllegalParameterError(`Cannot retrieve microblock at height strictly lower than 1: got ${height}`);

        // in case the asked height is strictly highest than the current height, we call the fallback method
        // because it might be to access a block not contained in the virtual blockchain but under construction.
        const currentVbHeight = this.getHeight();
        if (currentVbHeight < height) return await this.microblockSearchFailureFallback.onMicroblockSearchFailureForExceedingHeight(
            this,
            height
        );

        // if the virtual blockchain already contains the microblock, we return it directly
        const microblockContainedInCurrentVbInstance = this.microblockByHeight.get(height);
        if (microblockContainedInCurrentVbInstance !== undefined) return microblockContainedInCurrentVbInstance;

        // otherwise, the height is within the virtual blockchain range, we can safely retrieve the microblock
        const microblockHash = this.microblockHashByHeight.get(height);
        if (microblockHash === undefined) throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(this.getIdentifier(), height);

        // load the header and the body of the microblock from the provider
        const microblockHeader = await this.provider.getMicroblockHeader(Hash.from(microblockHash));
        if (microblockHeader === null) {
            const encoder = EncoderFactory.bytesToHexEncoder();
            throw new Error(`Unable to load microblock information from hash ${encoder.encode(microblockHash)} (height ${height})`);
        }
        const microblockBody = await this.provider.getMicroblockBody(Hash.from(microblockHash));
        if (microblockBody === null) throw new Error('Unable to load the microblock body')

        // instantiate the microblock
        const microblock = Microblock.loadFromHeaderAndBody(microblockHeader, microblockBody, this.type )

        // we store the microblock in the map
        this.microblockByHeight.set(height, microblock);

        // we notify the listeners that a new microblock has been inserted in the virtual blockchain
        for(const listener of this.onMicroblockInsertionEventListeners) {
            listener.onMicroblockInserted(this, microblock);
        }

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
    async appendMicroBlock(microblock: Microblock): Promise<void> {
        // raise internal error when invalid states are trigged; in practice, there cases should not happen
        // and are written for debugging purpose only

        // Case 1: the virtual blockchain is empty but contains an identifier
        if (this.isEmpty() && this.identifier instanceof Uint8Array)
            throw new Error("Virtual blockchain is empty but is initialized: should not happen");

        // Case 2: the virtual blockchain is not empty but do not contain an identifier
        if (!this.isEmpty() && !(this.identifier instanceof Uint8Array))
            throw new Error("Virtual blockchain is empty but has an identifier: should not happen");

        // we first check that the microblock has a valid structure
        const isValid = this.checkMicroblockStructure(microblock);
        if (!isValid) throw new IllegalParameterError("Provided microblock has an invalid structure")

        // TODO update the previous hash of the microblock if possible
        this.localState = await this.updateLocalState(this.localState, microblock);

        // if the current state of the vb is empty (no microblock), then update the identifier
        if (this.identifier === undefined) {
            this.identifier = microblock.getHash().toBytes();
        }



        // we increase the height of the vb
        this.height += 1;

        // we update the microblocks
        const mbHash = microblock.getHash().toBytes();
        this.microblockHashByHeight.set(this.height, mbHash);
        this.microblockByHeight.set(this.height, microblock);



        // we store the microblock
        /*
        const { headerData, bodyData } = microblock.serialize();
        await this.provider.storeMicroblock(
            mbHash,
            this.identifier,
            this.getType(),
            this.height,
            headerData,
            bodyData
        )
         */



    }

    setMicroblockSearchFailureFallback(fallback: IMicroblockSearchFailureFallback) {
        this.microblockSearchFailureFallback = fallback;
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
     * Retrieves the expiration day of the object.
     *
     * @return {number|string} The expiration day of the object. The type may vary depending on implementation.
     */
    getExpirationDay() {
        return this.expirationDay;
    }



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
