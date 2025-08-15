import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {Hash} from "../entities/Hash";
import {VirtualBlockchainStateInterface} from "../blockchain/types";

export class VirtualBlockchainStateWrapper {

    constructor(
        private readonly vbId: Hash,
        private readonly state: VirtualBlockchainStateInterface,
    ) {}

    getHeight(): number {
        return this.state.height;
    }

    getVbId(): Hash {
        return this.vbId;
    }

    getLastMicroblockHash(): Hash {
        return Hash.from(this.state.lastMicroblockHash)
    }

    getType(): VirtualBlockchainType {
        return this.state.type;
    }

    isAccountVirtualBlockchain(): boolean {
        return this.getType() === VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN
    }

    isOrganizationVirtualBlockchain(): boolean {
        return this.getType() === VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN;
    }

    isApplicationVirtualBlockchain(): boolean {
        return this.getType() === VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN;
    }

    isApplicationLedgerVirtualBlockchain(): boolean {
        return this.getType() === VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN;
    }

    isNodeVirtualBlockchain(): boolean {
        return this.getType() === VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN;
    }
}