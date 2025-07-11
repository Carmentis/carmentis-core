import {Hash} from "../blockchain/types";
import {VirtualBlockchainType} from "./VirtualBlockchainType";

import {VirtualBlockchainState} from "./VirtualBlockchainState";

export abstract class MicroBlockState {
    abstract getVirtualBlockchainState(): VirtualBlockchainState;
}
