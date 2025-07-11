import {MicroBlockHeader} from "./MicroBlockHeader";
import {VirtualBlockchainState} from "./VirtualBlockchainState";

export abstract class MicroBlockInformation {
    abstract getMicroBlockHeader(): MicroBlockHeader;
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
}