import {ApplicationMicroBlock} from "./MicroBlock";
import {MicroBlockType} from "../proto/section";
import {AbstractVirtualBlockchainView} from "./VirtualBlockchainView";
import {VirtualBlockchainType} from "./VirtualBlockchainType";

export class AppLedgerVirtualBlockchainView extends AbstractVirtualBlockchainView<ApplicationMicroBlock> {
    getSupportedMicroBlockType(): MicroBlockType {
        return MicroBlockType.APP_LEDGER_MICROBLOCK;
    }

    getType(): VirtualBlockchainType {
        return VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN;
    }
}