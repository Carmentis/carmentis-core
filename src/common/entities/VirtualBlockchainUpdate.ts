import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {AbstractMicroBlockHeader} from "./AbstractMicroBlockHeader";
import {Hash} from "./Hash";

export abstract class VirtualBlockchainUpdate {
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
    abstract getMicroBlockHashes(): Hash[];
}