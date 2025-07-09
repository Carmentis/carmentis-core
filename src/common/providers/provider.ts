import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Utils} from "../utils/utils";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {CryptoSchemeFactory} from "../crypto/factory";
import {
    AccountHash,
    AccountHistory,
    AccountStateDTO, Hash,
    MicroblockInformation,
    VirtualBlockchainState,
    ObjectList, AccountState
} from "../blockchain/types";
import {MemoryProvider} from "./memoryProvider";
import {NetworkProvider} from "./networkProvider";
import {EncoderFactory} from "../utils/encoder";
import {Microblock} from "../blockchain/microblock";
import {
    AccountNotFoundForAccountHashError,
    AccountNotFoundForPublicKeyError, AccountNotFoundForPublicKeyHashError,
    BlockchainError,
    CarmentisError
} from "../errors/carmentis-error";
import {CMTSToken} from "../economics/currencies/token";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {Base64} from "../data/base64";
import {MSG_ERROR, MSG_GET_ACCOUNT_HISTORY, NODE_MESSAGES} from "../constants/schemas";
import axios from "axios";

export interface BlockchainReader {
    getAccountState(accountHash: Hash): Promise<AccountState>;
    getAccountByPublicKeyHash(publicKeyHash: Hash): Promise<AccountHash>;
    getAccountByPublicKey(
        publicKey: PublicSignatureKey,
        hashScheme: CryptographicHash
    ): Promise<AccountHash>;
    getAccountHistory(accountHash: Hash): Promise<AccountHistory>;
    getMicroBlock(microBlockHash: Hash): Promise<Microblock>;
    getManyMicroblocks(microBlockHashes: Hash[]): Promise<Microblock>;
    getMicroblockInformation(): Promise<MicroblockInformation>;
    getBalance(accountHash: Hash): Promise<CMTSToken>;
}

export interface BlockchainWriter {
    /*
    sendMicroblock(...args: any[]): Promise<any>;
    awaitMicroblockAnchoring(...args: any[]): Promise<any>;
    setMicroblockInformation(...args: any[]): Promise<any>;
    setMicroblockBody(...args: any[]): Promise<any>;
    setVirtualBlockchainState(...args: any[]): Promise<any>;

     */
}

export class ABCINodeBlockchainReader {
    protected constructor(private nodeUrl: string) {}

    async getBalance(accountHash: Hash): Promise<CMTSToken> {
        const accountState = await this.getAccountState(accountHash);
        return accountState.getBalance();
    }

    getAccountState(accountHash: Hash): Promise<AccountState> {
        throw new AccountNotFoundForAccountHashError(accountHash);
    }
    getAccountByPublicKeyHash(publicKeyHash: Hash): Promise<AccountHash> {
        throw new AccountNotFoundForPublicKeyHashError(publicKeyHash)
    }
    async getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme: CryptographicHash): Promise<AccountHash> {
        const rawPublicKey = publicKey.getPublicKeyAsBytes();
        const publicKeyHash = hashScheme.hash(rawPublicKey);
        return  await this.getAccountByPublicKeyHash(Hash.from(publicKeyHash));
    }

    async getAccountHistory(accountHash: Hash, lastHistoryHash: Hash, maxRecords: number): Promise<AccountHistory> {
        const history  = await this.abciQuery<AccountHistory>(
            MSG_GET_ACCOUNT_HISTORY,
            {
                accountHash,
                lastHistoryHash,
                maxRecords
            }
        );
        return history;
    }

    getMicroBlock(microBlockHash: Hash): Promise<Microblock> {
        throw new CarmentisError("Method not implemented.");
    }
    getManyMicroblocks(microBlockHashes: Hash[]): Promise<Microblock> {
        throw new CarmentisError("Method not implemented.");
    }
    getMicroblockInformation(): Promise<MicroblockInformation> {
        throw new CarmentisError("Method not implemented.");
    }

    private async query(urlObject: any): Promise<{data: string}> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(urlObject, {}, {
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Accept': 'application/json',
                    }
                });
                const data = response.data
                //console.log("Received data", data)
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        })
    }

    private async abciQuery<T = object>(msgId: any, msgData: any): Promise<T> {
        const serializer = new MessageSerializer(NODE_MESSAGES);
        const unserializer = new MessageUnserializer(NODE_MESSAGES);
        const data = serializer.serialize(msgId, msgData);
        const urlObject = new URL(this.nodeUrl);

        urlObject.pathname = "abci_query";
        urlObject.searchParams.append("path", '"/carmentis"');
        urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

        const responseData = await this.query(urlObject);
        const binary = Base64.decodeBinary(responseData.data);
        const { type, object } = unserializer.unserialize(binary);

        if(type == MSG_ERROR) {
            // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.... Remove this comment to see the full error message
            throw new BlockchainError(`Remote error: ${object.error}`);
        }

        return object as T;
    }
}


export class ABCINodeBlockchainWriter extends ABCINodeBlockchainReader implements BlockchainWriter {
    constructor(nodeUrl: string, private privateKey: PrivateSignatureKey) {
        super(nodeUrl);
    }
}





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

    isKeyed() { return false; }

    async sendMicroblock(headerData: any, bodyData: any) {
        return await this.externalProvider.sendMicroblock(headerData, bodyData);
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        return await this.externalProvider.awaitMicroblockAnchoring(hash);
    }

    async getAccountState(accountHash: Uint8Array) : Promise<AccountStateDTO> {
        return await this.externalProvider.getAccountState(accountHash);
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistory> {
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
        return  await this.getAccountByPublicKeyHash(publicKeyHash);
    }

    async getObjectList(type: number): Promise<ObjectList> {
        return await this.externalProvider.getObjectList(type);
    }

    async storeMicroblock(hash: any, virtualBlockchainId: any, virtualBlockchainType: any, height: any, headerData: any, bodyData: any) {
        await this.internalProvider.setMicroblockInformation(
            hash,
            BlockchainUtils.encodeMicroblockInformation(virtualBlockchainType, virtualBlockchainId, headerData)
        );
        await this.internalProvider.setMicroblockBody(hash, bodyData);
    }

    async updateVirtualBlockchainState(virtualBlockchainId: any, type: any, height: any, lastMicroblockHash: any, customStateObject: any) {
        const stateData = BlockchainUtils.encodeVirtualBlockchainState(type, height, lastMicroblockHash, customStateObject);
        await this.internalProvider.setVirtualBlockchainState(virtualBlockchainId, stateData);
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation> {
        // FIXME: we should avoid the encoding/decoding passes when getting data from the external provider
        let data = await this.internalProvider.getMicroblockInformation(hash);

        if(!data) {
            const info = await this.externalProvider.getMicroblockInformation(hash);

            if(info) {
                data = BlockchainUtils.encodeMicroblockInformation(info.virtualBlockchainType, info.virtualBlockchainId, info.header);
                await this.internalProvider.setMicroblockInformation(hash, data);
            }
        }
        return data && BlockchainUtils.decodeMicroblockInformation(data);
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

    async getVirtualBlockchainStateInternal(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState> {
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
            const infoData = await this.internalProvider.getMicroblockInformation(microblockHash);
            const info = BlockchainUtils.decodeMicroblockInformation(infoData);
            headers.push(info.header);
            microblockHash = BlockchainUtils.previousHashFromHeader(info.header);
            height--;
        }
        return headers;
    }

    async getVirtualBlockchainContent(virtualBlockchainId: any) {
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
                const infoData = await this.internalProvider.getMicroblockInformation(microblockHash);

                if(!infoData) {
                    break;
                }
                const info = BlockchainUtils.decodeMicroblockInformation(infoData);
                headers.push(info.header);
                microblockHash = BlockchainUtils.previousHashFromHeader(info.header);
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
        const vbUpdate = await this.externalProvider.getVirtualBlockchainUpdate(virtualBlockchainId, knownHeight);

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

            // update the microblock information in our internal provider
            for(let n = 0; n < vbUpdate.headers.length; n++) {
                await this.internalProvider.setMicroblockInformation(
                    check.hashes[n],
                    BlockchainUtils.encodeMicroblockInformation(state.type, virtualBlockchainId, vbUpdate.headers[n])
                );
            }

            // add the new hashes to the hash list
            microblockHashes = [ ...microblockHashes, ...check.hashes.reverse() ];
        }

        return { state, microblockHashes };
    }
}
