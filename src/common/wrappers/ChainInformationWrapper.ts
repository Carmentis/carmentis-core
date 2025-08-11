import {ChainInformationDTO} from "../blockchain/types";

export class ChainInformationWrapper {
    static createFromDTO(chainInformation: ChainInformationDTO) {
        return new ChainInformationWrapper(chainInformation);
    }

    constructor(private readonly chainInformation: ChainInformationDTO) {}


    getHeight() {
        return this.chainInformation.height;
    }

    getLatestPublicationTime(): Date {
        return new Date(this.chainInformation.lastBlockTimestamp * 1000);
    }
}