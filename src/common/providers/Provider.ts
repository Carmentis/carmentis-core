import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {Utils} from "../utils/utils";
import {CryptographicHash, Sha256CryptographicHash} from "../crypto/hash/hash-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {
    AccountHistoryInterface,
    AccountStateDTO,
    AccountVBState,
    ApplicationLedgerLocalStateObject,
    ApplicationVBState,
    BlockContentDTO,
    BlockInformationDTO,
    ChainInformationDTO,
    GenesisSnapshotDTO,
    MicroblockInformationSchema,
    MsgVirtualBlockchainState,
    ObjectList,
    OrganizationVBState,
    ProtocolVBState,
    ValidatorNodeVBState
} from "../blockchain/types";
import {MemoryProvider} from "./MemoryProvider";
import {NetworkProvider} from "./NetworkProvider";
import {KeyedProvider} from "./KeyedProvider";
import {Hash} from "../entities/Hash";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {NotAuthenticatedError} from "../errors/carmentis-error";
import {Logger} from "../utils/Logger";
import {OrganizationLocalState} from "../blockchainV2/localStates/OrganizationLocalState";
import {AccountLocalState} from "../blockchainV2/localStates/AccountLocalState";
import {ApplicationLedgerLocalState} from "../blockchainV2/localStates/ApplicationLedgerLocalState";
import {ApplicationLocalState} from "../blockchainV2/localStates/ApplicationLocalState";
import {ProtocolLocalState} from "../blockchainV2/localStates/ProtocolLocalState";
import {ValidatorNodeLocalState} from "../blockchainV2/localStates/ValidatorNodeLocalState";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {Microblock} from "../blockchain/Microblock";
import {BlockchainSerializer} from "../data/BlockchainSerializer";

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

    getPrivateSignatureKey(): PrivateSignatureKey {
        throw new NotAuthenticatedError();
    }

    getPublicSignatureKey(): PublicSignatureKey {
        throw new NotAuthenticatedError();
    }

    async sendMicroblock(headerData: any, bodyData: any) {
        return await this.externalProvider.sendSerializedMicroblock(headerData, bodyData);
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
        const logger = Logger.getLogger([Provider.name]);
        logger.debug(`Account hash ${externalAccountHash} is associated to public key hash ${publicKeyHash}`)

        // TODO: save it locally
        return externalAccountHash.accountHash;
    }

    async getAccountHashByPublicKey(
        publicKey: PublicSignatureKey,
        hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()
    ) {
        const rawPublicKey = publicKey.getPublicKeyAsBytes();
        const publicKeyHash = hashScheme.hash(rawPublicKey);
        return await this.getAccountByPublicKeyHash(publicKeyHash);
    }


    async getAllAccounts(): Promise<Hash[]> {
        const list = await this.getObjectList(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN);
        return list.list.map(Hash.from)
    }

    async getObjectList(type: VirtualBlockchainType): Promise<ObjectList> {
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

    async getVirtualBlockchainStateInternal(virtualBlockchainId: Uint8Array): Promise<MsgVirtualBlockchainState> {
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

    async getVirtualBlockchainFromId(vbId: Hash) {

    }

    async getOrganizationVirtualBlockchainById(organizationId: Hash) {

    }

    async getVirtualBlockchainLocalStateFromId<T>(organizationId: Hash): Promise<T> {
        const state = await this.getVirtualBlockchainContent(organizationId.toBytes());
        if (state === undefined || state?.state === undefined) throw new Error(`Cannot load the local state of vb ${organizationId.encode()}`)
        return state.state.customState as T;
    }

    async getOrganizationLocalStateFromId(organizationId: Hash) {
        return OrganizationLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<OrganizationVBState>(organizationId)
        );
    }

    async getAccountOrganizationLocalStateFromId(accountId: Hash) {
        return AccountLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<AccountVBState>(accountId)
        )
    }

    async getApplicationLedgerLocalStateFromId(appLedgerId: Hash) {
        return ApplicationLedgerLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<ApplicationLedgerLocalStateObject>(appLedgerId)
        )
    }

    async getApplicationLocalStateFromId(applicationId: Hash) {
        return ApplicationLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<ApplicationVBState>(applicationId)
        )
    }

    async getProtocolLocalStateFromId(protocolId: Hash) {
        return ProtocolLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<ProtocolVBState>(protocolId)
        )
    }

    async getValidatorNodeLocalStateFromId(validatorNodeId: Hash) {
        return ValidatorNodeLocalState.createFromLocalState(
            await this.getVirtualBlockchainLocalStateFromId<ValidatorNodeVBState>(validatorNodeId)
        )
    }

    async getAccountHashFromPublicKey(publicKey: PublicSignatureKey) {
        const hashScheme = new Sha256CryptographicHash();
        const answer = await this.externalProvider.getAccountByPublicKeyHash(
            hashScheme.hash(publicKey.getPublicKeyAsBytes())
        );
        return Hash.from(answer.accountHash);
    }

    publishMicroblock(microblockToPublish: Microblock) {
        const {headerData: serializedHeader, bodyData:serialiazedBody} = microblockToPublish.serialize();
        return this.externalProvider.sendSerializedMicroblock(serializedHeader, serialiazedBody)
    }
}
