import {VirtualBlockchainState, VirtualBlockchainStateDto} from "./types";

/**
 * Describes the state of a virtual blockchain, includings its
 */
export interface VirtualBlockchainStatus<T = unknown> {
    state: VirtualBlockchainState<T>,
    microblockHashes: Uint8Array<ArrayBufferLike>[]
}
