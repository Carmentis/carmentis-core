import {Utils} from "../utils/utils";
import {Logger} from "../utils/Logger";
import {IInternalProvider} from "./IInternalProvider";
import {BlockchainUtils} from "../utils/blockchainUtils";
import {VirtualBlockchainInfo} from "../type/valibot/provider/VirtualBlockchainInfo";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";

type StringToBinaryMap = Map<string, Uint8Array>
export class MemoryProvider implements IInternalProvider {

    private logger = Logger.getMemoryProviderLogger();
    private static instance: MemoryProvider = new MemoryProvider();

    static getInstance() {
        return this.instance;
    }

    private microblockHeaderStore: StringToBinaryMap;
    private microblockBodyStore: StringToBinaryMap;
    private microblockVbInformationStore: StringToBinaryMap;
    private virtualBlockchainStateStore: StringToBinaryMap;

    constructor() {
        this.microblockHeaderStore = new Map;
        this.microblockBodyStore = new Map;
        this.microblockVbInformationStore = new Map;
        this.virtualBlockchainStateStore = new Map;
    }

    clear() {
        this.logger.debug(`Clearing`);
        this.microblockHeaderStore = new Map;
        this.microblockBodyStore = new Map;
        this.microblockVbInformationStore = new Map;
        this.virtualBlockchainStateStore = new Map;
    }

    async getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<Uint8Array | null> {
        const result = await MemoryProvider.get(this.microblockVbInformationStore, hash);
        this.logger.debug(`getMicroblockVbInformation identifier=${Utils.binaryToHexa(hash)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getInformationOfVirtualBlockchainContainingMicroblock(hash: Uint8Array): Promise<VirtualBlockchainInfo | null> {
        const serializedInfo = await this.getSerializedInformationOfVirtualBlockchainContainingMicroblock(hash);
        if (serializedInfo === null) return null;
        return BlockchainUtils.decodeVirtualBlockchainInfo(serializedInfo);
    }

    async getMicroblock(identifier: Uint8Array) {
        return new Uint8Array();
    }


    async getMicroblockHeader(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockHeaderStore, identifier);
        this.logger.debug(`getMicroblockHeader identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        if (result === null) return null;
        return BlockchainUtils.decodeMicroblockHeader(result);
    }

    async getSerializedMicroblockHeader(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockHeaderStore, identifier);
        this.logger.debug(`getMicroblockHeader identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getMicroblockBody(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.microblockBodyStore, identifier);
        this.logger.debug(`getMicroblockBody identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getSerializedVirtualBlockchainState(identifier: Uint8Array) {
        const result = await MemoryProvider.get(this.virtualBlockchainStateStore, identifier);
        this.logger.debug(`getVirtualBlockchainState identifier=${Utils.binaryToHexa(identifier)} -> ${result ? result.length : 0} bytes`);
        return result;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        // TODO: this could (and should) be cached locally in order to avoid querying the network each time
        return null;
    }

    async setMicroblockVbInformation(identifier: Uint8Array, data: Uint8Array) {
        this.logger.debug(`setMicroblockVbInformation identifier=${Utils.binaryToHexa(identifier)} -> ${data.length} bytes`);
        return await MemoryProvider.set(this.microblockVbInformationStore, identifier, data);
    }


    async setSerializedMicroblockHeader(identifier: Uint8Array, header: Uint8Array) {
        this.logger.debug(`setMicroblockHeader identifier=${Utils.binaryToHexa(identifier)} -> ${header.length} bytes`);
        return await MemoryProvider.set(this.microblockHeaderStore, identifier, header);
    }

    async setSerializedMicroblockBody(identifier: Uint8Array, body: Uint8Array) {
        this.logger.debug(`setMicroblockBody identifier=${Utils.binaryToHexa(identifier)} -> ${body.length} bytes`);
        return await MemoryProvider.set(this.microblockBodyStore, identifier, body);
    }

    async setMicroblockHeader(identifier: Uint8Array, header: MicroblockHeader) {
        const data = BlockchainUtils.encodeMicroblockHeader(header);
        await this.setSerializedMicroblockHeader(identifier, data);
    }

    async setMicroblockBody(identifier: Uint8Array, body: MicroblockBody) {
        const data =  BlockchainUtils.encodeMicroblockBody(body);
        await this.setSerializedMicroblockBody(identifier, data);
    }

    async setSerializedVirtualBlockchainState(identifier: Uint8Array, data: Uint8Array) {
        this.logger.debug(`setVirtualBlockchainState identifier=${Utils.binaryToHexa(identifier)} -> ${data.length} bytes`);
        return await MemoryProvider.set(this.virtualBlockchainStateStore, identifier, data);
    }

    static async get(store: StringToBinaryMap, identifier: Uint8Array): Promise<Uint8Array | null> {
        const key = Utils.binaryToHexa(identifier);
        if (!store.has(key)) {
            return null;
        }
        const result = store.get(key);
        return result instanceof Uint8Array ? result : null;
    }

    static async set(store: StringToBinaryMap, identifier: Uint8Array, data: Uint8Array) {
        const key = Utils.binaryToHexa(identifier);

        store.set(key, data);
    }
}
