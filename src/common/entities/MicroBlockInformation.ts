import {MicroBlockHeaderWrapper} from "../wrappers/MicroBlockHeaderWrapper";
import {VirtualBlockchainStateWrapper} from "../wrappers/VirtualBlockchainStateWrapper";

export class MicroBlockInformation {

    constructor(
        private readonly header: MicroBlockHeaderWrapper,
        private readonly state: VirtualBlockchainStateWrapper,
    ) {}

    getMicroBlockHeader(): MicroBlockHeaderWrapper {
        return this.header;
    }

    getVirtualBlockchainState(): VirtualBlockchainStateWrapper {
        return this.state;
    }
}