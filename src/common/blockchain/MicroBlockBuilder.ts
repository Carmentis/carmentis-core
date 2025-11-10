import {VirtualBlockchain} from "./VirtualBlockchain";
import {Microblock} from "./Microblock";
import {SectionType} from "../entities/SectionType";
import {IllegalStateError} from "../errors/carmentis-error";

export class MicroBlockBuilder {
    static createBuilder(virtualBlockchain: VirtualBlockchain<any>) {
        const vbType = virtualBlockchain.getType();
        return new MicroBlockBuilder(
            new Microblock(vbType),
            virtualBlockchain
        )
    }

    constructor(
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