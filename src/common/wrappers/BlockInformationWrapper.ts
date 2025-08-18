import {BlockInformationDTO} from "../blockchain/types";
import {Hash} from "../entities/Hash";

export class BlockInformationWrapper {


    constructor(
        private readonly height: number,
        private readonly blockInformation: BlockInformationDTO
    ) {}

    getBlockHeight() {
        return this.height;
    }

    getBlockHash() {
        return Hash.from(this.blockInformation.hash);
    }

    anchoredAt(): Date {
        return new Date(this.blockInformation.timestamp * 1000);
    }

    getProposerNode(): Hash {
        return Hash.from(this.blockInformation.proposerAddress);
    }
}