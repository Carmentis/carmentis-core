import {BlockInformationDTO} from "../blockchain/types";
import {Hash} from "../entities/Hash";

export class BlockInformationWrapper {

    static createFromDTO(answer: BlockInformationDTO) {
        return new BlockInformationWrapper(answer);
    }

    constructor(private readonly blockInformation: BlockInformationDTO) {}

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