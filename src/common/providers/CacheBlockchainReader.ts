import {BlockchainReader} from "./provider";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {AccountState, Hash} from "../blockchain/types";
import {CMTSToken} from "../economics/currencies/token";
import {
    AbstractVirtualBlockchainView
} from "../entities/VirtualBlockchainView";
import {AbstractMicroBlock} from "../entities/MicroBlock";
import {MicroBlockHeader} from "../entities/MicroBlockHeader";
import {MultiVirtualBlockchainView} from "../entities/MultiVirtualBlockchainView";
import {VirtualBlockchainState} from "../entities/VirtualBlockchainState";

/**
 * A wrapper class implementing the BlockchainReader interface that caches certain blockchain data
 * for improved performance. The caching mechanism utilizes an internal MultiVirtualBlockchainView
 * to store data from virtual blockchains when appropriate.
 *
 */
export class CacheBlockchainReader implements BlockchainReader {

    private view = MultiVirtualBlockchainView.createEmptyView();

    constructor(private reader: BlockchainReader) {}

    getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme?: CryptographicHash): Promise<Hash> {
        return this.reader.getAccountByPublicKey(publicKey, hashScheme);
    }

    getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords?: number): Promise<AccountHistoryView> {
        return this.reader.getAccountHistory(accountHash, lastHistoryHash, maxRecords);
    }

    getAccountState(accountHash: Hash): Promise<AccountState> {
        return this.reader.getAccountState(accountHash);
    }

    getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken> {
        return this.reader.getBalanceOfAccount(accountHash);
    }

    async getFirstMicroBlockInVirtualBlockchain<VB extends AbstractVirtualBlockchainView<MB>, MB extends AbstractMicroBlock = AbstractMicroBlock >(vbId: Hash): Promise<VB> {
        if (this.view.containsMicroBlockAtHeight(vbId, 1)) return this.view.getView<MB>(vbId) as VB;
        const updatedView = await this.reader.getFirstMicroBlockInVirtualBlockchain(vbId)
        this.view.addView(vbId, updatedView);
        return updatedView as VB;
    }

    getFullVirtualBlockchainView<VB extends AbstractVirtualBlockchainView<MB>, MB extends AbstractMicroBlock = AbstractMicroBlock >(vbId: Hash): Promise<VB> {
        return this.reader.getFullVirtualBlockchainView(vbId);
    }

    getMicroBlockHeader(vbId: Hash, height: number): Promise<MicroBlockHeader> {
        return this.reader.getMicroBlockHeader(vbId, height);
    }

    getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainState> {
        return this.reader.getVirtualBlockchainState(vbId);
    }

    getVirtualBlockchainView<VB extends AbstractVirtualBlockchainView<MB>, MB extends AbstractMicroBlock = AbstractMicroBlock >(vbId: Hash, heights: number[]): Promise<VB> {
        return this.reader.getVirtualBlockchainView(vbId, heights);
    }

    lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash> {
        return this.reader.lockUntilMicroBlockPublished(microblockHash);
    }

    /**
     * Creates a new instance of CacheBlockchainReader using the provided BlockchainReader.
     *
     * @param {BlockchainReader} blockchainReader - The blockchain reader instance to be wrapped.
     * @return {CacheBlockchainReader} A new instance of CacheBlockchainReader wrapping the provided blockchain reader.
     */
    static createFromBlockchainReader(blockchainReader: BlockchainReader) {
        return new CacheBlockchainReader(blockchainReader)
    }
}