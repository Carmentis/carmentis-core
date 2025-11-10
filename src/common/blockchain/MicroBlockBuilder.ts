import {VirtualBlockchain} from "./VirtualBlockchain";
import {Microblock} from "./Microblock";
import {SectionType} from "../entities/SectionType";
import {IllegalStateError} from "../errors/carmentis-error";

export class MicroBlockBuilder {

    static createBuilder(virtualBlockchain: VirtualBlockchain<any>) {
        const vbType = virtualBlockchain.getType();
        const vbHeight = virtualBlockchain.height;
        const isGenesis = vbHeight === 0;
        const mb = new Microblock(vbType);
        const previousHash = vbHeight ? virtualBlockchain.microblockHashes[vbHeight - 1] : null;
        const defaultExpirationDay = 0;
        mb.create(vbHeight + 1, previousHash, defaultExpirationDay);
        return new MicroBlockBuilder(
            isGenesis,
            new Microblock(vbType),
            virtualBlockchain
        )
    }


    constructor(
        private isGenesis: boolean,
        private currentMicroBlock: Microblock,
        private vb: VirtualBlockchain<any>
    ) {
    }

    async addSection(type: SectionType, object: any) {
        const section = this.currentMicroBlock.addSection(type, object);
        await this.vb.processSectionCallback(this.currentMicroBlock, section);
    }

    serialize(): {microblockHash: Uint8Array<ArrayBufferLike>, headerData: Uint8Array<ArrayBufferLike>, bodyHash: Uint8Array<ArrayBufferLike>, bodyData: Uint8Array<ArrayBufferLike>} {
        return this.currentMicroBlock.serialize();
    }
}