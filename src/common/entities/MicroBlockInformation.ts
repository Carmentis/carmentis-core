import {AbstractMicroBlockHeader} from "./AbstractMicroBlockHeader";
import {VirtualBlockchainState} from "./VirtualBlockchainState";

export abstract class MicroBlockInformation {
    abstract getMicroBlockHeader(): AbstractMicroBlockHeader;
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
}