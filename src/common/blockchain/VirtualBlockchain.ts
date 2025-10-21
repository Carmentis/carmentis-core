import {CHAIN} from "../constants/constants";
import {Microblock, Section} from "./Microblock";
import {Utils} from "../utils/utils";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {Provider} from "../providers/Provider";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {
    InternalError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError,
    VirtualBlockchainNotFoundError
} from "../errors/carmentis-error";
import {SectionType} from "../entities/SectionType";

export abstract class VirtualBlockchain<CustomState> {
    currentMicroblock: Microblock | null;
    height: number;
    identifier: any;
    microblockHashes: any;
    provider: Provider;
    sectionCallbacks: any;
    state?: CustomState;
    type: number;
    expirationDay: number;

    constructor({provider, type}: { provider: Provider, type: number }) {
        if(!CHAIN.VB_NAME[type]) {
            throw `Invalid virtual blockchain type '${type}'`;
        }
        this.provider = provider;
        this.sectionCallbacks = new Map;
        this.microblockHashes = [];
        this.currentMicroblock = null;
        this.type = type;
        this.expirationDay = 0;
        this.height = 0;
    }

    setExpirationDay(day: number) {
        if(this.height) {
            throw new Error("The expiration day cannot be changed anymore.");
        }
        this.expirationDay = day;
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

    isVirtualBlockchainIdDefined(): boolean {
        return this.identifier instanceof Uint8Array;
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
    async load(identifier: Uint8Array) {
        const content = await this.provider.getVirtualBlockchainContent(identifier);
        const vbId = Hash.from(identifier);

        if(content === null || content.state === undefined) {
            throw new VirtualBlockchainNotFoundError(vbId);
        }

        if(this.type != content.state.type) {
            throw `inconsistent virtual blockchain type (expected ${this.type}, got ${content.state.type})`;
        }

        this.identifier = identifier;
        this.height = content.state.height;
        this.expirationDay = content.state.expirationDay;
        this.state = content.state.customState as CustomState;
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
        return this.getMicroblock(1);
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
            throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(this.getIdentifier(), height);
        }
        const info = await this.provider.getMicroblockInformation(hash);

        if(info === null) {
            throw new Error("unable to load microblock information");
        }

        const bodyList = await this.provider.getMicroblockBodys([ hash ]);
        const microblock = new Microblock(this.type);
        microblock.load(info.header, bodyList[0].body);

        return microblock;
    }

    getIdentifier(): Hash {
        return Hash.from(this.identifier);
    }

    /**
     Adds a section to the current microblock.
     */
    async addSection(type: SectionType, object: any) {
        if(!this.currentMicroblock) {
            this.currentMicroblock = new Microblock(this.type);
            const previousHash = this.height ? this.microblockHashes[this.height - 1] : null;
            this.height++;
            this.currentMicroblock.create(this.height, previousHash, this.expirationDay);
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
     * @param {CMTSToken} gasPrice
     */
    setGasPrice(gasPrice: CMTSToken) {
        if (!this.currentMicroblock) throw new Error("Cannot set gas price on a microblock that has not been created yet.");
        this.currentMicroblock.gasPrice = gasPrice.getAmountAsAtomic();
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
    async publish(waitForAnchoring: boolean) {
        if(!this.currentMicroblock) throw new InternalError("Cannot publish a microblock that has not been created yet.");

        this.checkStructure(this.currentMicroblock);

        const { microblockHash, headerData, bodyHash, bodyData } = this.currentMicroblock.serialize();

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
}
