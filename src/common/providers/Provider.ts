import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Utils} from "../utils/utils";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {
    AccountHistoryInterface,
    ChainInformationDTO,
    BlockInformationDTO,
    BlockContentDTO,
    AccountStateDTO,
    MicroblockInformationSchema,
    ObjectList, GenesisSnapshotDTO
} from "../blockchain/types";
import {MemoryProvider} from "./MemoryProvider";
import {NetworkProvider} from "./NetworkProvider";
import {VirtualBlockchainStateWrapper} from "../wrappers/VirtualBlockchainStateWrapper";
import {KeyedProvider} from "./KeyedProvider";
import {Hash} from "../entities/Hash";

/**
 * Represents a provider class that interacts with both internal and external providers for managing blockchain states and microblocks.
 */
export class Provider {
    externalProvider: NetworkProvider;
    internalProvider: MemoryProvider;
    constructor(internalProvider: any, externalProvider: any) {
        this.internalProvider = internalProvider;
        this.externalProvider = externalProvider;
    }

    isKeyed(): this is KeyedProvider { return false; }

    async sendMicroblock(headerData: any, bodyData: any) {
        return await this.externalProvider.sendMicroblock(headerData, bodyData);
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        return await this.externalProvider.awaitMicroblockAnchoring(hash);
    }

    async getChainInformation() : Promise<ChainInformationDTO> {
        return await this.externalProvider.getChainInformation();
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotDTO> {
        return await this.externalProvider.getGenesisSnapshot();
    }

    async getBlockInformation(height: number) : Promise<BlockInformationDTO> {
        return await this.externalProvider.getBlockInformation(height);
    }

    async getBlockContent(height: number) : Promise<BlockContentDTO> {
        return await this.externalProvider.getBlockContent(height);
    }

    async getAccountState(accountHash: Uint8Array) : Promise<AccountStateDTO> {
        return await this.externalProvider.getAccountState(accountHash);
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryInterface> {
        return await this.externalProvider.getAccountHistory(accountHash, lastHistoryHash, maxRecords);
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        const internalAccountHash = await this.internalProvider.getAccountByPublicKeyHash(publicKeyHash);

        if(internalAccountHash !== null) {
          return internalAccountHash;
        }

        const externalAccountHash = await this.externalProvider.getAccountByPublicKeyHash(publicKeyHash);

        // TODO: save it locally
        return externalAccountHash;
    }

    async getAccountByPublicKey(
        publicKey: PublicSignatureKey,
        hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()
    ) {
        const rawPublicKey = publicKey.getPublicKeyAsBytes();
        const publicKeyHash = hashScheme.hash(rawPublicKey);
        return await this.getAccountByPublicKeyHash(publicKeyHash);
    }

    async getObjectList(type: number): Promise<ObjectList> {
        return await this.externalProvider.getObjectList(type);
    }

    async storeMicroblock(hash: any, virtualBlockchainId: any, virtualBlockchainType: number, height: number, headerData: Uint8Array, bodyData: Uint8Array) {
        await this.internalProvider.setMicroblockVbInformation(
            hash,
            BlockchainUtils.encodeMicroblockVbInformation(virtualBlockchainType, virtualBlockchainId)
        );
        await this.internalProvider.setMicroblockHeader(hash, headerData);
        await this.internalProvider.setMicroblockBody(hash, bodyData);
    }

    async updateVirtualBlockchainState(virtualBlockchainId: Uint8Array, type: number, expirationDay: number, height: number, lastMicroblockHash: Uint8Array, customStateObject: any) {
        const stateData = BlockchainUtils.encodeVirtualBlockchainState(type, expirationDay, height, lastMicroblockHash, customStateObject);
        await this.internalProvider.setVirtualBlockchainState(virtualBlockchainId, stateData);
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformationSchema|null> {
        const data = await this.internalProvider.getMicroblockVbInformation(hash);
        const header = await this.internalProvider.getMicroblockHeader(hash);

        if(data && header) {
          return {
            ...BlockchainUtils.decodeMicroblockVbInformation(data),
            header
          };
        }

        const info = await this.externalProvider.getMicroblockInformation(hash);

        if(info) {
            const data = BlockchainUtils.encodeMicroblockVbInformation(info.virtualBlockchainType, info.virtualBlockchainId);
            await this.internalProvider.setMicroblockVbInformation(hash, data);
            await this.internalProvider.setMicroblockHeader(hash, info.header);
            return info;
        }
        return null;
    }

    async getMicroblockBodys(hashes: Uint8Array[]) {
        // get as much data as possible from the internal provider
        const res = [];
        const missingHashes = [];

        for(const hash of hashes) {
            const body = await this.internalProvider.getMicroblockBody(hash);

            if(body) {
                res.push({ hash, body });
            }
            else {
                missingHashes.push(hash);
            }
        }

        // if necessary, request missing data from the external provider
        if(missingHashes.length) {
            const externalData = await this.externalProvider.getMicroblockBodys(missingHashes);

            if(externalData === null) {
              throw `Unable to load microblock bodies`;
            }

            // save missing data in the internal provider and update res[]
            for(const { hash, body } of externalData.list) {
                await this.internalProvider.setMicroblockBody(hash, body);
                res.push({ hash, body });
            }

            // for convenience, we sort the list according to the original query order
            res.sort((a, b) => hashes.indexOf(a.hash) - hashes.indexOf(b.hash));
        }

        return res;
    }

    async getVirtualBlockchainHashes( virtualBlockchainId: Uint8Array ): Promise<Uint8Array[]> {
        const content = await this.getVirtualBlockchainContent(virtualBlockchainId);
        if (content === undefined || content?.microblockHashes === undefined) throw new Error('Cannot access the virtual blockchain')
        return content.microblockHashes;
    }

    async getVirtualBlockchainStateInternal(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStateWrapper> {
        return await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);
    }

    async getVirtualBlockchainStateExternal(virtualBlockchainId: Uint8Array) {
        return await this.externalProvider.getVirtualBlockchainState(virtualBlockchainId);
    }

    async getVirtualBlockchainHeaders(virtualBlockchainId: any, knownHeight: any) {
        const stateData = await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);
        const state = BlockchainUtils.decodeVirtualBlockchainState(stateData);

        let height = state.height;
        let microblockHash = state.lastMicroblockHash;
        const headers = [];

        while(height > knownHeight) {
            const header = await this.internalProvider.getMicroblockHeader(microblockHash);
            headers.push(header);
            microblockHash = BlockchainUtils.previousHashFromHeader(header);
            height--;
        }
        return headers;
    }

    async getVirtualBlockchainContent(virtualBlockchainId: Uint8Array) {
        let microblockHashes: string | any[] = [];
        let state;

        // get the state of this VB from our internal provider
        const stateData = await this.internalProvider.getVirtualBlockchainState(virtualBlockchainId);

        // if found, make sure that we still have all the microblock headers up to the height associated to this state
        // and that they are consistent
        if(stateData) {
            state = BlockchainUtils.decodeVirtualBlockchainState(stateData);
            let height = state.height;
            let microblockHash = state.lastMicroblockHash;
            const headers = [];

            while(height) {
                const header = await this.internalProvider.getMicroblockHeader(microblockHash);

                if(!header) {
                    break;
                }
                headers.push(header);
                microblockHash = BlockchainUtils.previousHashFromHeader(header);
                height--;
            }

            if(height == 0) {
                const check = BlockchainUtils.checkHeaderList(headers);

                if(check.valid) {
                    check.hashes.reverse();

                    if(Utils.binaryIsEqual(check.hashes[0], virtualBlockchainId)) {
                        microblockHashes = check.hashes;
                    }
                    else {
                        console.error("WARNING - genesis microblock hash from internal storage does not match VB identifier");
                    }
                }
                else {
                    console.error("WARNING - inconsistent hash chain in internal storage");
                }
            }
        }

        // query our external provider for state update and new headers, starting at the known height
        const knownHeight = microblockHashes.length;
        const vbUpdate = await this.externalProvider.getVirtualBlockchainUpdate(
            virtualBlockchainId,
            knownHeight
        );

        if(!vbUpdate.exists) {
            return null;
        }

        if(vbUpdate.changed) {
            // check the consistency of the new headers
            const check = BlockchainUtils.checkHeaderList(vbUpdate.headers);

            if(!check.valid) {
                throw `received headers are inconsistent`;
            }

            // make sure that the 'previous hash' field of the first new microblock matches the last known hash
            if(knownHeight) {
                const firstNewHeader = vbUpdate.headers[vbUpdate.headers.length - 1];
                const linkedHash = BlockchainUtils.previousHashFromHeader(firstNewHeader);

                if(!Utils.binaryIsEqual(linkedHash, microblockHashes[knownHeight - 1])) {
                    throw `received headers do not link properly to the last known header`;
                }
            }

            // update the VB state in our internal provider
            await this.internalProvider.setVirtualBlockchainState(virtualBlockchainId, vbUpdate.stateData);

            state = BlockchainUtils.decodeVirtualBlockchainState(vbUpdate.stateData);

            // update the microblock information and header in our internal provider
            for(let n = 0; n < vbUpdate.headers.length; n++) {
                await this.internalProvider.setMicroblockVbInformation(
                    check.hashes[n],
                    BlockchainUtils.encodeMicroblockVbInformation(
                        state.type,
                        virtualBlockchainId
                    )
                );
                await this.internalProvider.setMicroblockHeader(
                    check.hashes[n],
                    vbUpdate.headers[n]
                );
            }

            // add the new hashes to the hash list
            microblockHashes = [ ...microblockHashes, ...check.hashes.reverse() ];
        }

        return { state, microblockHashes };
    }
}
