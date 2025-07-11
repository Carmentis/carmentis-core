import {BlockchainReader} from "./provider";
import {
    AccountHash,
    AccountHistoryInterface,
    AccountStateDTO,
    MicroBlockBodys, MicroblockInformationSchema,
    MsgVirtualBlockchainState, VirtualBlockchainUpdateInterface
} from "../blockchain/types";
import {
    AbstractVirtualBlockchainView,
    AccountVirtualBlockchainView,
    ApplicationVirtualBlockchainView,
    OrganisationVirtualBlockchainView
} from "../entities/VirtualBlockchainView";
import axios from "axios";
import {Utils} from "../utils/utils";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {Base64} from "../data/base64";
import {SCHEMAS} from "../constants/constants";
import {AbstractMicroBlock} from "../entities/MicroBlock";
import {CMTSToken} from "../economics/currencies/token";
import {NodeError, NotImplementedError, VirtualBlockchainNotFoundError} from "../errors/carmentis-error";
import {MicroBlockHeader} from "../entities/MicroBlockHeader";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {URL} from "url";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptoSchemeFactory} from "../crypto/factory";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {AppLedgerVirtualBlockchainView} from "../entities/AppLedgerVirtualBlockchainView";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {VirtualBlockchainState} from "../entities/VirtualBlockchainState";
import {MicroBlockInformation} from "../entities/MicroBlockInformation";
import {MicroBlockHeaderInterface} from "../entities/MicroBlockHeaderInterface";
import {NodeTranslator} from "../entities/NodeTranslator";
import {VirtualBlockchainUpdate} from "../entities/VirtualBlockchainUpdate";
import {Hash} from "../entities/Hash";
import {AccountState} from "../entities/AccountState";

export class ABCINodeBlockchainReader implements BlockchainReader {
    /**
     * Creates an instance of ABCINodeBlockchainReader from the provided node URL.
     *
     * @param {string} nodeUrl - The URL of the node to connect to.
     * @return {ABCINodeBlockchainReader} A new instance of ABCINodeBlockchainReader initialized with the specified node URL.
     */
    static createFromNodeURL(nodeUrl: string): ABCINodeBlockchainReader {
        return new ABCINodeBlockchainReader(nodeUrl);
    }

    protected constructor(private nodeUrl: string) {}


    getMicroBlockBody(microblockHash: Hash): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getManyMicroBlockBody(hashes: Hash[]): Promise<void> {
        // search the block
        const answer = await this.abciQuery<MicroBlockBodys>(
            SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
            {
                hashes: hashes.map(h => h.toBytes())
            }
        );

        // parse all microblocks
        for (const data of answer.list) {
            const body =

        }


        return answer;
    }

    async getMicroBlock(microblockHash: Hash): Promise<AbstractMicroBlock> {
        throw new NotImplementedError() // TODO
    }

    async getVirtualBlockchainContent(vbId: Hash): Promise<void> {
        // we first search the virtual blockchain state in our internal provider
        const state = await this.getVirtualBlockchainState(vbId);
        const lastMicroBlockHash = state.getLastMicroblockHash();

    }

    private async getVirtualBlockchainUpdate(vbId: Hash, knownHeight: number): Promise<VirtualBlockchainUpdate> {
        const answer = await this.abciQuery<VirtualBlockchainUpdateInterface>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE,
            {
                virtualBlockchainId: vbId.toBytes(),
                knownHeight
            }
        );
        if (!answer.exists) throw new VirtualBlockchainNotFoundError(vbId);
        const state = NodeTranslator.translateVirtualBlockchainState(vbId, BlockchainUtils.decodeVirtualBlockchainState(answer.stateData));
        const headers = answer.headers.map(h => NodeTranslator.translateMicroBlockHeader(BlockchainUtils.decodeMicroblockHeader(h)));
        return NodeTranslator.translateVirtualBlockchainUpdate(state, headers);
    }


    /*
    async getVirtualBlockchainContent(vbId: Hash): Promise<void> {
        let microblockHashes: string | any[] = [];

        // we first search the virtual blockchain state in our internal provider
        const state = await this.getVirtualBlockchainState(vbId);
        const lastMicroBlockHash = state.getLastMicroblockHash();


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
                const infoData = await this.getMicroblockInformation(microblockHash);

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

     */
    async getMicroblockInformation(hash: Hash): Promise<MicroBlockInformation> {
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
            {
                hash
            }
        );
        // parse the header
        const headerObject: MicroBlockHeaderInterface = BlockchainUtils.decodeMicroblockHeader(answer.header);
        const header = NodeTranslator.translateMicroBlockHeader(headerObject);

        // parse and retrieve virtual blockchain state
        const virtualBlockchainId = Hash.from(answer.virtualBlockchainId);
        const virtualBlockchainState = await this.getVirtualBlockchainState(virtualBlockchainId);

        return NodeTranslator.translateMicroBlockInformation(header, virtualBlockchainState);
    }





    /**
     * Locks the current process until the specified microblock is published.
     *
     * @param {Hash} microblockHash - The hash of the microblock to wait for publishing.
     * @return {Promise<Hash>} A promise that resolves to the virtual blockchain ID where the micro-block is published
     */
    async lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash> {
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
            {
                hash: microblockHash.toBytes()
            }
        );
        return Hash.from(answer.virtualBlockchainId);
    }

    async getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords?: number): Promise<AccountHistoryView> {
        const answer = await this.abciQuery<AccountHistoryInterface>(
            SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
            {
                accountHash,
                lastHistoryHash,
                maxRecords
            }
        );

        // convert the response into transactions
        const transactions = new AccountHistoryView();
        for (const t of answer.list) {
            transactions.setTransactionAtHeight(t.height, t);
        }

        return transactions;
    }

    async getAccountState(accountHash: Hash): Promise<AccountState> {
        const answer = await this.abciQuery<AccountStateDTO>(
            SCHEMAS.MSG_GET_ACCOUNT_STATE,
            {
                accountHash: accountHash.toBytes()
            }
        );
        return AccountState.createFromDTO(answer)
    }

    async getFullVirtualBlockchainView<VB extends AbstractVirtualBlockchainView<MB>, MB extends AbstractMicroBlock = AbstractMicroBlock>(vbId: Hash): Promise<VB> {
        const state = await this.getVirtualBlockchainState(vbId);
        const endHeight = state.getHeight();
        const heights = Array.from({ length: endHeight }, (_, i) => i + 1);
        return this.getVirtualBlockchainView(vbId, heights);
    }

    async getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken> {
        const accountState = await this.getAccountState(accountHash);
        return accountState.getBalance();
    }

    getFirstMicroBlockInVirtualBlockchain<VB extends AbstractVirtualBlockchainView<MB>, MB extends AbstractMicroBlock = AbstractMicroBlock>(vbId: Hash): Promise<VB> {
        return this.getVirtualBlockchainView(vbId, [1]);
    }

    getMicroBlockHeader(vbId: Hash, height: number): Promise<MicroBlockHeader> {
        throw new NotImplementedError(); // TODO
    }

    async getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()): Promise<Hash> {
        const answer = await this.abciQuery<AccountHash>(
            SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
            {
                publicKeyHash: hashScheme.hash(publicKey.getPublicKeyAsBytes())
            }
        );
        return Hash.from(answer.accountHash);
    }

    async getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainState> {
        const answer = await this.abciQuery<MsgVirtualBlockchainState>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_STATE,
            {
                virtualBlockchainState: vbId.toBytes(),
            }
        );

        const state =  BlockchainUtils.decodeVirtualBlockchainState(answer.stateData);
        return NodeTranslator.translateVirtualBlockchainState(vbId, state);
    }

    async getVirtualBlockchainView<VB extends AbstractVirtualBlockchainView<AbstractMicroBlock>>(vbId: Hash, heights: number[]): Promise<VB> {
        // we first recreate an empty view of the virtual blockchain
        const state = await this.getVirtualBlockchainState(vbId);
        const virtualBlockchainType: VirtualBlockchainType = state.getType();
        let vb: AbstractVirtualBlockchainView<AbstractMicroBlock>;
        switch (virtualBlockchainType) {
            case VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN: vb = new AccountVirtualBlockchainView(state); break;
            case VirtualBlockchainType.ORGANISATION_VIRTUAL_BLOCKCHAIN: vb = new OrganisationVirtualBlockchainView(state); break;
            case VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN: vb = new ApplicationVirtualBlockchainView(state); break;
            case VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN: vb = new AppLedgerVirtualBlockchainView(state); break;
            case VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN: throw new NotImplementedError(); // TODO
            default: throw new NodeError(`Invalid virtual blockchain type: ${virtualBlockchainType}`);
        }

        // then, we populate the view with required microblocks
        for (const height of heights) {
            const mb = await this.getMicroBlockAtHeightInVirtualBlockchain(vbId, height);
            vb.addMicroBlock(mb);
        }

        return vb as VB;
    }


    private getMicroBlockAtHeightInVirtualBlockchain(vbId: Hash, height: number): Promise<AbstractMicroBlock> {
        throw new NotImplementedError();
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
                return resolve(data);
            } catch (e) {
                reject(e);
            }
        })
    }


    private async abciQuery<T = object>(msgId: any, msgData: any): Promise<T> {
        const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
        const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
        const data = serializer.serialize(msgId, msgData);
        const urlObject = new URL(this.nodeUrl);

        urlObject.pathname = "abci_query";
        urlObject.searchParams.append("path", '"/carmentis"');
        urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

        const responseData = await this.query(urlObject);
        const binary = Base64.decodeBinary(responseData.data);
        const { type, object } = unserializer.unserialize(binary);

        if(type == SCHEMAS.MSG_ERROR) {
            // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.... Remove this comment to see the full error message
            throw new NodeError(object.error);
        }

        return object as T;
    }







}