import {VirtualBlockchainType} from "./VirtualBlockchainType";

import {VirtualBlockchainState} from "./VirtualBlockchainState";
import {Hash} from "./Hash";

export abstract class MicroBlockState {
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
}
