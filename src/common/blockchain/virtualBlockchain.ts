import { CHAIN } from "../constants/constants";
import {Microblock, Section} from "./microblock";
import { Utils } from "../utils/utils";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {EncoderFactory} from "../utils/encoder";
import {Hash, VirtualBlockchainStateInterface} from "./types";
import {BlockchainReader, Provider} from "../providers/provider";

export abstract class VirtualBlockchain<CustomState> {
    currentMicroblock: Microblock | null;
    height: number;
    identifier: any;
    microblockHashes: any;
    provider: BlockchainReader;
    sectionCallbacks: any;
    state?: CustomState;
    type: number;

    constructor({provider, type}: { provider: BlockchainReader, type: number }) {
        if(!CHAIN.VB_NAME[type]) {
            throw `Invalid virtual blockchain type '${type}'`;
        }
        this.provider = provider;
        this.sectionCallbacks = new Map;
        this.microblockHashes = [];
        this.currentMicroblock = null;
        //this.state = {};
        this.type = type;
        this.height = 0;
    }

    protected getState(): CustomState {
        if (!this.state) {
            this.state = this.getInitialState();
        }
        return this.state;
    }

    protected getInitialState(): CustomState {
        throw new Error("State is undefined and no initial state has been defined.");
    }

    async getGenesisSeed() {
        const mb = await this.getFirstMicroBlock();
        return mb.header.previousHash;
    }

    getHeight(): number {
        return this.height;
    }



    getId(): Uint8Array {
        return this.identifier
    }

    abstract checkStructure(microblock: any): void;

    /**
     Registers a callback for a given section type.
     */
    registerSectionCallback(sectionType: any, callback: any) {
        this.sectionCallbacks.set(sectionType, callback.bind(this));
    }

    /**
     Loads a VB from its identifier.
     */
    async load(identifier: any) {
        const content = await this.provider.getVirtualBlockchainContent(identifier);

        if(!content) {
            throw `virtual blockchain ${Utils.binaryToHexa(identifier)} not found`;
        }

        if(this.type != content.state.type) {
            throw `inconsistent virtual blockchain type (expected ${this.type}, got ${content.state.type})`;
        }

        this.identifier = identifier;
        this.height = content.state.height;
        this.state = content.state.customState;
        this.microblockHashes = content.microblockHashes;
    }


    /**
     Imports a microblock defined by its header data and body data.
     */
    async importMicroblock(headerData: any, bodyData: any) {
        this.currentMicroblock = new Microblock(this.type);

        this.currentMicroblock.load(headerData, bodyData);
        this.checkStructure(this.currentMicroblock);

        for(const section of this.currentMicroblock.sections) {
            await this.processSectionCallback(this.currentMicroblock, section);
        }

        this.height++;

        if(this.currentMicroblock.header.height == 1) {
            this.identifier = this.currentMicroblock.hash;
        }

        return this.currentMicroblock.hash;
    }

    /**
     * Retrieves the first microblock.
     *
     * @return {Promise<Microblock>} A promise that resolves to the first microblock data.
     */
    async getFirstMicroBlock() {
        return this.getMicroblock(1)
    }



    /**
     Returns the microblock at the given height.
     */
    async getMicroblock(height: number) {
        if(height == this.microblockHashes.length + 1 && this.currentMicroblock) {
            return this.currentMicroblock;
        }

        const hash = this.microblockHashes[height - 1];

        if(!hash) {
            throw `cannot retrieve microblock at height ${height}`;
        }

        const info = await this.provider.getMicroblockInformation(hash);
        const bodyList = await this.provider.getManyMicroBlockBody([ hash ]);

        const microblock = new Microblock(this.type);
        microblock.load(info.header, bodyList[0].body);

        return microblock;
    }

    /**
     Adds a section to the current microblock.
     */
    async addSection(type: number, object: any) {
        if(!this.currentMicroblock) {
            this.currentMicroblock = new Microblock(this.type);
            const previousHash = this.height ? this.microblockHashes[this.height - 1] : null;
            this.height++;
            this.currentMicroblock.create(this.height, previousHash);
        }

        const section = this.currentMicroblock.addSection(type, object);
        await this.processSectionCallback(this.currentMicroblock, section);
    }

    /**
     Processes a section callback (if defined).
     */
    async processSectionCallback(microblock: Microblock, section: Section) {
        if(this.sectionCallbacks.has(section.type)) {
            const callback = this.sectionCallbacks.get(section.type);
            await callback(microblock, section);
        }
    }

    /**
     * Creates a cryptographic signature for a microblock.
     *
     * @param {PrivateSignatureKey} privateKey - The private key used to generate the signature.
     * @param {boolean} [withGas=true] - Specifies whether the signature should include gas information.
     * @return {{ signature: Uint8Array }} An object containing the generated signature as a Uint8Array.
     * @throws {Error} If no microblock has been created yet.
     */
    createSignature(privateKey: PrivateSignatureKey, withGas = true) : { signature: Uint8Array } {
        if (!this.currentMicroblock) throw new Error(
            "Cannot create a signature for a microblock that has not been created yet."
        )
        const signature = this.currentMicroblock.createSignature(privateKey, withGas);
        return { signature };
    }

    /**
     * Set the gas price for the current microblock.
     *
     * @param {number} price
     */
    setGasPrice(gasPrice: number) {
        if (!this.currentMicroblock) throw new Error("Cannot set gas price on a microblock that has not been created yet.");
        this.currentMicroblock.gasPrice = gasPrice;
    }

    /**
     Returns the raw data of the current microblock.
     */
    getMicroblockData() {
        if(!this.currentMicroblock) throw new Error("Cannot get the data of a microblock that has not been created yet.");

        this.checkStructure(this.currentMicroblock);

        const { headerData, bodyData } = this.currentMicroblock.serialize();

        return Utils.binaryFrom(headerData, bodyData);
    }

    /**
     Publishes the current microblock.
     */
    async publish() {
        if(!this.currentMicroblock) throw new Error("Cannot publish a microblock that has not been created yet.");

        this.checkStructure(this.currentMicroblock);

        const { microblockHash, headerData, bodyHash, bodyData } = this.currentMicroblock.serialize();

        this.microblockHashes[this.height - 1] = microblockHash;

        if(this.height == 1) {
            this.identifier = microblockHash;
        }

        // TODO use the writer provider
        //await this.provider.sendMicroblock(headerData, bodyData);
        //await this.provider.awaitMicroblockAnchoring(microblockHash);

        return Hash.from(microblockHash);
    }
}
