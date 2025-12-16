import {BlockchainUtils} from "../utils/blockchainUtils";
import {Utils} from "../utils/utils";
import {CryptographicHash, Sha256CryptographicHash} from "../crypto/hash/hash-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Hash} from "../entities/Hash";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {IllegalStateError, MicroBlockNotFoundError} from "../errors/carmentis-error";
import {Logger} from "../utils/Logger";
import {VirtualBlockchainType} from "../type/VirtualBlockchainType";
import {Microblock} from "../blockchain/microblock/Microblock";
import {Assertion} from "../utils/Assertion";
import {IInternalProvider} from "./IInternalProvider";
import {IExternalProvider} from "./IExternalProvider";
import {AbstractProvider} from "./AbstractProvider";
import {ProtocolInternalState} from "../blockchain/internalStates/ProtocolInternalState";
import {VirtualBlockchainState} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {MicroblockBody} from "../type/valibot/blockchain/microblock/MicroblockBody";
import {MicroblockHeader} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {VirtualBlockchainStatus} from "../type/valibot/provider/VirtualBlockchainStatus";
import {MicroblockInformation, MicroblockInformationSchema} from "../type/valibot/provider/MicroblockInformationSchema";
import {
    AccountHistoryAbciResponse,
    AccountStateAbciResponse,
    BlockContentAbciResponse,
    BlockInformationAbciResponse,
    ChainInformationAbciResponse,
    GenesisSnapshotAbciResponse, ObjectListAbciResponse
} from "../type/valibot/provider/abci/AbciResponse";

/**
 * Represents a provider class that interacts with both internal and external providers for managing blockchain states and microblocks.
 */
export class Provider extends AbstractProvider {

    private logger = Logger.getProviderLogger();
    private externalProvider: IExternalProvider;
    private internalProvider: IInternalProvider;

    constructor(internalProvider: IInternalProvider, externalProvider: IExternalProvider) {
        super();
        this.internalProvider = internalProvider;
        this.externalProvider = externalProvider;
    }

    async sendMicroblock(headerData: Uint8Array, bodyData: Uint8Array) {
        return await this.externalProvider.sendSerializedMicroblock(headerData, bodyData);
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        return await this.externalProvider.awaitMicroblockAnchoring(hash);
    }

    async getChainInformation() : Promise<ChainInformationAbciResponse> {
        return await this.externalProvider.getChainInformation();
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotAbciResponse> {
        return await this.externalProvider.getGenesisSnapshot();
    }

    async getBlockInformation(height: number) : Promise<BlockInformationAbciResponse> {
        return await this.externalProvider.getBlockInformation(height);
    }

    async getBlockContent(height: number) : Promise<BlockContentAbciResponse> {
        return await this.externalProvider.getBlockContent(height);
    }

    async getAccountState(accountHash: Uint8Array) : Promise<AccountStateAbciResponse> {
        return await this.externalProvider.getAccountState(accountHash);
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryAbciResponse> {
        return await this.externalProvider.getAccountHistory(accountHash, lastHistoryHash, maxRecords);
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        const internalAccountHash = await this.internalProvider.getAccountByPublicKeyHash(publicKeyHash);

        if(internalAccountHash !== null) {
          return internalAccountHash;
        }

        const externalAccountHash = await this.externalProvider.getAccountByPublicKeyHash(publicKeyHash);
        const logger = Logger.getLogger([Provider.name]);
        logger.debug(`Account hash ${externalAccountHash} is associated to public key hash ${publicKeyHash}`)

        // TODO: save it locally
        return externalAccountHash.accountHash;
    }

    async getVirtualBlockchainState(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainState | null> {
        this.logger.debug(`Getting state for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)}`);
        const serializedVirtualBlockchainState = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (serializedVirtualBlockchainState !== null) {
            this.logger.debug(`State for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)} found locally`);
            return BlockchainUtils.decodeVirtualBlockchainState(serializedVirtualBlockchainState)
        } else {
            const receivedSerializedVirtualBlockchainState = await this.externalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
            if (receivedSerializedVirtualBlockchainState) {
                this.logger.debug(`State for virtual blockchain ${Utils.binaryToHexa(virtualBlockchainId)} found online`);
                await this.internalProvider.setSerializedVirtualBlockchainState(virtualBlockchainId, receivedSerializedVirtualBlockchainState);
                return BlockchainUtils.decodeVirtualBlockchainState(receivedSerializedVirtualBlockchainState);
            } else {
                return null;
            }
        }
    }

    async getAccountIdByPublicKey(
        publicKey: PublicSignatureKey,
        hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()
    ) {
        const rawPublicKey = await publicKey.getPublicKeyAsBytes();
        const publicKeyHash = hashScheme.hash(rawPublicKey);
        return await this.getAccountByPublicKeyHash(publicKeyHash);
    }

    async getProtocolVariables(): Promise<ProtocolInternalState> {
        const id = await this.getProtocolVirtualBlockchainId();
        const state = await this.getVirtualBlockchainState(id.toBytes());
        if (state === null) {
          throw new Error(`Cannot get protocol parameters from the internal provider`);
        }
        if (state.type !== VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN) throw new Error(
            `Expected protocol virtual blockchain, got ${VirtualBlockchainType[state.type]}`
        )
        return ProtocolInternalState.createFromObject(state.internalState);
    }

    async getProtocolVirtualBlockchainId(): Promise<Hash> {
        const list = await this.getObjectList(VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN);
        const foundVirtualBlockchainCount = list.list.length;
        if (foundVirtualBlockchainCount === 0) {
            this.logger.error('No protocol virtual blockchain found: Expecting exactly one protocol virtual blockchain.')
            throw new Error("No protocol virtual blockchain found");
        }
        if (foundVirtualBlockchainCount !== 1) {
            this.logger.warning("Found " + foundVirtualBlockchainCount + " protocol virtual blockchains, expecting exactly one");
        }
        return Hash.from(list.list[0])
    }


    async getAllAccounts(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    async getObjectList(type: VirtualBlockchainType): Promise<ObjectListAbciResponse> {
        return await this.externalProvider.getObjectList(type);
    }

    /*
    async storeMicroblock(hash: Uint8Array, virtualBlockchainId: Uint8Array, virtualBlockchainType: number, height: number, headerData: Uint8Array, bodyData: Uint8Array) {
        Assertion.assert(virtualBlockchainId instanceof Uint8Array, `virtualBlockchainId must be an Uint8Array: got ${typeof virtualBlockchainId}`);
        Assertion.assert(headerData instanceof Uint8Array, `headerData must be an Uint8Array: got ${typeof headerData}`);
        Assertion.assert(bodyData instanceof Uint8Array, `bodyData must be an Uint8Array: got ${typeof bodyData}`);
        Assertion.assert(headerData.length > 0, "headerData must not be empty");
        Assertion.assert(bodyData.length > 0, "bodyData must not be empty");
        this.logger.debug(`Storing microblock: microblock hash={microblockHash}, vbId={vbId}, height={height}`, () => ({
            microblockHash: Utils.binaryToHexa(hash),
            vbId: Utils.binaryToHexa(virtualBlockchainId),
            height
        }));
        await this.internalProvider.setMicroblockVbInformation(
            hash,
            BlockchainUtils.encodeMicroblockVbInformation(virtualBlockchainType, virtualBlockchainId)
        );
        await this.internalProvider.setMicroblockHeader(hash, headerData);
        await this.internalProvider.setMicroblockBody(hash, bodyData);
    }

    async updateVirtualBlockchainState(virtualBlockchainId: Uint8Array, type: number, expirationDay: number, height: number, lastMicroblockHash: Uint8Array, internalState: unknown) {
        const stateData = BlockchainUtils.encodeVirtualBlockchainState({
            expirationDay,
            height,
            internalState,
            lastMicroblockHash,
            type
        });
        await this.internalProvider.setSerializedVirtualBlockchainState(virtualBlockchainId, stateData);
    }

     */

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation|null> {
        const data = await this.internalProvider.getInformationOfVirtualBlockchainContainingMicroblock(hash);
        const header = await this.internalProvider.getMicroblockHeader(hash);

        if(data && header) {
          return {
            ...data,
            header
          };
        }

        const info = await this.externalProvider.getMicroblockInformation(hash);
        if (info) {
            const data = BlockchainUtils.encodeVirtualBlockchainInfo({
                virtualBlockchainId: info.virtualBlockchainId,
                virtualBlockchainType: info.virtualBlockchainType,
            });
            await this.internalProvider.setMicroblockVbInformation(hash, data);
            await this.internalProvider.setMicroblockHeader(hash, info.header);
            return info;
        }
        return null;
    }

    async getListOfMicroblockBody(hashes: Uint8Array[]) {
        // get as much data as possible from the internal provider
        const res: {hash: Uint8Array, body: MicroblockBody}[] = [];
        const missingHashes: Uint8Array[] = [];

        // we first search in the internal provider to retrieve information locally
        let index = 0;
        for (const hash of hashes) {
            const serializedBody = await this.internalProvider.getMicroblockBody(hash);
            if (serializedBody) {
                const body = BlockchainUtils.decodeMicroblockBody(serializedBody);
                res.push({hash, body});
            } else {
                missingHashes.push(hash);
            }
            index += 1;
        }

        // if necessary, request missing data from the external provider
        if (missingHashes.length) {
            const microblockBodysResponse = await this.externalProvider.getMicroblockBodys(missingHashes);

            if (microblockBodysResponse === null) {
              throw new Error(`Unable to load microblock bodies`);
            }

            // save missing data in the internal provider and update res[]
            for (const { hash, body } of microblockBodysResponse.list) {
                const serializedBody = body;
                const hashBytes = Utils.binaryFromHexa(hash);
                await this.internalProvider.setSerializedMicroblockBody(hashBytes, serializedBody);
                const decodedBody = BlockchainUtils.decodeMicroblockBody(serializedBody);
                res.push({ hash: hashBytes, body: decodedBody });
            }

            // for convenience, we sort the list according to the original query order
            res.sort((a, b) => hashes.indexOf(a.hash) - hashes.indexOf(b.hash));
        }

        return res.map(a => a.body);
    }

    async getMicroblockBody(microblockHash: Hash): Promise<MicroblockBody | null> {
        const serializedBody = await this.internalProvider.getMicroblockBody(microblockHash.toBytes());
        if (serializedBody instanceof Uint8Array) {
            this.logger.debug(`Body for microblock ${microblockHash.encode()} found locally`)
            return BlockchainUtils.decodeMicroblockBody(serializedBody)
        } else {
            const externalData = await this.externalProvider.getMicroblockBodys([
                microblockHash.toBytes()
            ]);
            if (externalData !== null && externalData.list.length !== 0) {
                const bodyResponse = externalData.list[0];
                const serializedBody = bodyResponse.body;
                await this.internalProvider.setSerializedMicroblockBody(microblockHash.toBytes(), serializedBody);
                const decodedBody = BlockchainUtils.decodeMicroblockBody(serializedBody);
                this.logger.debug(`Body for microblock ${microblockHash.encode()} found online`)
                return decodedBody;
            }
        }
        // we do not have found the microblock body
        this.logger.warning(`Body for microblock ${microblockHash.encode()} not found`)
        return null;
    }
    async getMicroblockHeader(microblockHash: Hash): Promise<MicroblockHeader | null> {
        const serializedHedaer = await this.internalProvider.getSerializedMicroblockHeader(microblockHash.toBytes());
        if (serializedHedaer instanceof Uint8Array) return BlockchainUtils.decodeMicroblockHeader(serializedHedaer);
        const receivedSerializedHeader = await this.externalProvider.getMicroblockInformation(microblockHash.toBytes());
        if (receivedSerializedHeader !== null) {
            return receivedSerializedHeader.header;
        } else {
            throw new MicroBlockNotFoundError();
        }
    }

    async getVirtualBlockchainIdContainingMicroblock(microblockHash: Hash): Promise<Hash> {
        // TODO: log
        const info = await this.internalProvider.getInformationOfVirtualBlockchainContainingMicroblock(microblockHash.toBytes());
        if (info !== null) {
             return Hash.from(info.virtualBlockchainId);
        } else {
            const receivedInfo = await this.externalProvider.getMicroblockInformation(microblockHash.toBytes());
            if (receivedInfo !== null) {
                return Hash.from(receivedInfo.virtualBlockchainId);
            } else {
                throw new MicroBlockNotFoundError();
            }
        }
    }

    async getVirtualBlockchainHashes( virtualBlockchainId: Uint8Array ): Promise<Uint8Array[]> {
        const content = await this.getVirtualBlockchainStatus(virtualBlockchainId);
        if (content === undefined || content?.microblockHashes === undefined) throw new Error('Cannot access the virtual blockchain')
        return content.microblockHashes;
    }

    async getVirtualBlockchainHeaders(virtualBlockchainId: Uint8Array, knownHeight: number) {
        // we first search on the internal provider for the state of this VB
        const stateData = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (stateData instanceof Uint8Array) {
            // recover the state of the virtual blockchain
            const state = BlockchainUtils.decodeVirtualBlockchainState(stateData);
            let height = state.height;
            let microblockHash = state.lastMicroblockHash;

            // load all the headers from the known height to the initial block
            const headers = [];
            while (height > knownHeight) {
                const header = await this.internalProvider.getSerializedMicroblockHeader(microblockHash);
                if (header instanceof Uint8Array) {
                    headers.push(header);
                    microblockHash = BlockchainUtils.previousHashFromHeader(header);
                    height--;
                } else {
                    throw new IllegalStateError(`Cannot get the headers of a non-existing microblock ${Utils.binaryToHexa(microblockHash)}`);
                }
            }

            return headers;
        } else {
            throw new IllegalStateError("Cannot get the headers of a non-existing VB");
        }

    }

    /**
     * Returns the virtual blockchain content (state and hashes) from the internal and external providers.
     *
     * @param virtualBlockchainId The identifier of the virtual blockchain.
     */
    async getVirtualBlockchainStatus(virtualBlockchainId: Uint8Array): Promise<VirtualBlockchainStatus | null> {
        let microblockHashes: Uint8Array[] = [];
        let vbState: VirtualBlockchainState | null = null;

        // We start by retrieving the virtual blockchain state locally.
        // If found, we make sure that we still have all the microblock headers up to the height associated to this state
        // and that they are consistent
        const serializedState = await this.internalProvider.getSerializedVirtualBlockchainState(virtualBlockchainId);
        if (serializedState !== null) {
            vbState = BlockchainUtils.decodeVirtualBlockchainState(serializedState);
            let height = vbState.height;
            let microblockHash = vbState.lastMicroblockHash;
            const headers = [];

            while(height) {
                const header = await this.internalProvider.getSerializedMicroblockHeader(microblockHash);
                if (!header) {
                    break;
                }
                headers.push(header);
                microblockHash = BlockchainUtils.previousHashFromHeader(header);
                height--;
            }

            if (height == 0) {
                const check = BlockchainUtils.checkHeaderList(headers);
                if (check.valid) {
                    check.hashes.reverse();
                    if(Utils.binaryIsEqual(check.hashes[0], virtualBlockchainId)) {
                        microblockHashes = check.hashes;
                    } else {
                        this.logger.warning("WARNING - genesis microblock hash from internal storage does not match VB identifier");
                    }
                } else {
                    this.logger.warning("WARNING - inconsistent hash chain in internal storage");
                }
            } else {
                // TODO: we can do a check, even for incomplete hashes
            }
        }

        // query our external provider for state update and new headers, starting at the known height
        const knownHeight = microblockHashes.length;
        const vbUpdate = await this.externalProvider.getVirtualBlockchainUpdate(
            virtualBlockchainId,
            knownHeight
        );

        if (!vbUpdate.exists) return null;
        if (vbUpdate.changed) {
            // check the consistency of the new headers
            const check = BlockchainUtils.checkHeaderList(vbUpdate.headers);

            if (!check.valid) {
                throw new Error(`received headers are inconsistent`);
            }

            // make sure that the 'previous hash' field of the first new microblock matches the last known hash
            if (knownHeight) {
                const firstNewHeader = vbUpdate.headers[vbUpdate.headers.length - 1];
                const linkedHash = BlockchainUtils.previousHashFromHeader(firstNewHeader);

                if(!Utils.binaryIsEqual(linkedHash, microblockHashes[knownHeight - 1])) {
                    throw new Error(`received headers do not link properly to the last known header`);
                }
            }

            // update the VB state in our internal provider
            await this.internalProvider.setSerializedVirtualBlockchainState(virtualBlockchainId, vbUpdate.stateData);

            vbState = BlockchainUtils.decodeVirtualBlockchainState(vbUpdate.stateData);

            // update the microblock information and header in our internal provider
            for(let n = 0; n < vbUpdate.headers.length; n++) {
                await this.internalProvider.setMicroblockVbInformation(
                    check.hashes[n],
                    BlockchainUtils.encodeVirtualBlockchainInfo({
                        virtualBlockchainType: vbState.type,
                        virtualBlockchainId
                    })
                );
                await this.internalProvider.setSerializedMicroblockHeader(
                    check.hashes[n],
                    vbUpdate.headers[n]
                );
            }

            // add the new hashes to the hash list
            microblockHashes = [ ...microblockHashes, ...check.hashes.reverse() ];
        }

        //
        if (vbState === null) return null;

        return { state: vbState, microblockHashes };
    }


    async getAccountIdFromPublicKey(publicKey: PublicSignatureKey) {
        const hashScheme = new Sha256CryptographicHash();
        const answer = await this.externalProvider.getAccountByPublicKeyHash(
            hashScheme.hash(await publicKey.getPublicKeyAsBytes())
        );
        return Hash.from(answer.accountHash);
    }

    publishMicroblock(microblockToPublish: Microblock) {
        const {headerData: serializedHeader, bodyData:serialiazedBody} = microblockToPublish.serialize();
        return this.externalProvider.sendSerializedMicroblock(serializedHeader, serialiazedBody)
    }


}
