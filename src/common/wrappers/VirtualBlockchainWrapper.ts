import {Hash} from "../entities/Hash";
import {VirtualBlockchainStateWrapper} from "./VirtualBlockchainStateWrapper";

export class VirtualBlockchainWrapper {

    constructor(
        private readonly state: VirtualBlockchainStateWrapper,
        private readonly microblocks: Hash[],
    ) {}

    getVirtualBlockchainState() {
        return this.state;
    }

    getMicroBlockHashes(): Hash[] {
        return this.microblocks;
    }
}