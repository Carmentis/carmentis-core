import {Hash} from "../blockchain/types";
import {VirtualBlockchainType} from "./VirtualBlockchainType";

export abstract class VirtualBlockchainState {
    abstract getHeight(): number;

    abstract getVbId(): Hash;

    abstract getLastMicroblockHash(): Hash;

    abstract getType(): VirtualBlockchainType;
}