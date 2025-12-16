import {
    AccountHash, AccountHistoryInterface, AccountStateDTO, BlockContentDTO, BlockInformationDTO, ChainInformationDTO,
    GenesisSnapshotDTO, MicroblockBodyListResponse,
    MsgVirtualBlockchainState, ObjectList, ValidatorNodeDTO,
    VirtualBlockchainUpdateInterface
} from "../type/types";
import {MicroblockInformation} from "../type/valibot/provider/MicroblockInformation";

export interface IExternalProvider {
    sendSerializedMicroblock(headerData: Uint8Array, bodyData: Uint8Array): Promise<any>;

    awaitMicroblockAnchoring(hash: Uint8Array): Promise<MicroblockInformation>;

    getChainInformation(): Promise<ChainInformationDTO>;

    getBlockInformation(height: number): Promise<BlockInformationDTO>;

    getBlockContent(height: number): Promise<BlockContentDTO>;

    getValidatorNodeByAddress(address: Uint8Array): Promise<ValidatorNodeDTO>;

    getAccountState(accountHash: Uint8Array): Promise<AccountStateDTO>;

    getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryInterface>;

    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<AccountHash>;

    getObjectList(type: number): Promise<ObjectList>;

    getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null> ;

    getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodyListResponse  | null>;

    getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number): Promise<VirtualBlockchainUpdateInterface>;

    getSerializedVirtualBlockchainState(virtualBlockchainId: any): Promise<Uint8Array>;

    broadcastTx(data: Uint8Array): Promise<any>;

    abciQuery<T = object>(msgId: number, msgData: object): Promise<T>

    getGenesisSnapshot(): Promise<GenesisSnapshotDTO>;

}