import {BlockContentDTO} from "../blockchain/types";
import {Hash} from "../entities/Hash";
import {
    MicroBlockNotFoundInBlockError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError
} from "../errors/carmentis-error";

export class BlockContentWrapper {

    static createFromDTO(blockContentDTO: BlockContentDTO) {
        return new BlockContentWrapper(blockContentDTO);
    }

    constructor(private readonly blockContentDTO: BlockContentDTO) {}

    getContainedMicroBlockHashes() : Hash[] {
        return this.blockContentDTO.microblocks.map(mb => Hash.from(mb.hash))
    }

    getContainedMicroBlockHeight() : number[] {
        return this.blockContentDTO.microblocks.map(mb => mb.height);
    }

    numberOfContainedMicroBlocks() : number {
        return this.blockContentDTO.microblocks.length;
    }

    getMicroBlockAtHeight(height: number) : MicroBlockInBlockContentWrapper {
        const mb = this.blockContentDTO.microblocks.find(mb => mb.height === height);
        if (!mb) throw new MicroBlockNotFoundInBlockError();
        return new MicroBlockInBlockContentWrapper(this.blockContentDTO.microblocks[height]);
    }

    getMicroBlocksByVirtualBlockchainId(virtualBlockchainId: Hash) : MicroBlockInBlockContentWrapper[] {
        return this.blockContentDTO.microblocks
            .filter(mb => virtualBlockchainId.equals(Hash.from(mb.hash)))
            .map(mb => new MicroBlockInBlockContentWrapper(mb));
    }
}

class MicroBlockInBlockContentWrapper {
    constructor(
        private readonly microBlock: BlockContentDTO["microblocks"][number],
    ) {}

    getHeight() : number {
        return this.microBlock.height;
    }

    getVirtualBlockchainId() : Hash {
        return Hash.from(this.microBlock.hash);
    }

    getMicroBlockHash() : Hash {
        return Hash.from(this.microBlock.hash);
    }
}