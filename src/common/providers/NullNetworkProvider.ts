import { ChainInformationDTO, BlockInformationDTO, BlockContentDTO, ValidatorNodeDTO, AccountStateDTO, AccountHistoryInterface, AccountHash, ObjectList, MicroblockBodyListResponse, VirtualBlockchainUpdateInterface, MsgVirtualBlockchainState, GenesisSnapshotDTO } from "../common";
import {IExternalProvider} from "./IExternalProvider";
import {MicroblockInformation} from "../type/valibot/provider/MicroblockInformation";

/**
 This is the dummy external provider for nodes.
 */
export class NullNetworkProvider implements IExternalProvider {
    constructor() {
    }

    sendSerializedMicroblock(headerData: Uint8Array, bodyData: Uint8Array): Promise<any> {
        throw new Error("Method not implemented.");
    }
    awaitMicroblockAnchoring(hash: Uint8Array): Promise<MicroblockInformation> {
        throw new Error("Method not implemented.");
    }
    getChainInformation(): Promise<ChainInformationDTO> {
        throw new Error("Method not implemented.");
    }
    getBlockInformation(height: number): Promise<BlockInformationDTO> {
        throw new Error("Method not implemented.");
    }
    getBlockContent(height: number): Promise<BlockContentDTO> {
        throw new Error("Method not implemented.");
    }
    getValidatorNodeByAddress(address: Uint8Array): Promise<ValidatorNodeDTO> {
        throw new Error("Method not implemented.");
    }
    getAccountState(accountHash: Uint8Array): Promise<AccountStateDTO> {
        throw new Error("Method not implemented.");
    }
    getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number): Promise<AccountHistoryInterface> {
        throw new Error("Method not implemented.");
    }
    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<AccountHash> {
        throw new Error("Method not implemented.");
    }
    getObjectList(type: number): Promise<ObjectList> {
        throw new Error("Method not implemented.");
    }

    getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformation | null>  {
        return Promise.resolve(null);
    }

    getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroblockBodyListResponse | null > {
        return Promise.resolve(null);
    }
    getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number): Promise<VirtualBlockchainUpdateInterface> {
        return Promise.resolve({ exists: true, changed: false });
    }
    getSerializedVirtualBlockchainState(virtualBlockchainId: any): Promise<Uint8Array> {
        throw new Error("Method not implemented.");
    }
    broadcastTx(data: Uint8Array): Promise<any> {
        throw new Error("Method not implemented.");
    }
    abciQuery<T = object>(msgId: number, msgData: object): Promise<T> {
        throw new Error("Method not implemented.");
    }
    getGenesisSnapshot(): Promise<GenesisSnapshotDTO> {
        throw new Error("Method not implemented.");
    }



    /*
    async getMicroblockInformation() {
      return null;
    }

    async getMicroblockBodys() {
      return null;
    }

    async getVirtualBlockchainUpdate() {
      return { changed: false, exists: true };
    }

     */
}
