import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {MicroBlockHeader} from "./MicroBlockHeader";

export abstract class VirtualBlockchainUpdate {
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
    abstract getMicroBlockHeaders(): MicroBlockHeader[];
}