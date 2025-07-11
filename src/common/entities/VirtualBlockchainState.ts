import {VirtualBlockchainType} from "./VirtualBlockchainType";
import {Hash} from "./Hash";

export abstract class VirtualBlockchainState {
    abstract getHeight(): number;

    abstract getVbId(): Hash;

    abstract getLastMicroblockHash(): Hash;

    abstract getType(): VirtualBlockchainType;
}