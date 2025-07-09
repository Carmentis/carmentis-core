import {MicroBlock} from "./MicroBlock";
import {Section} from "./Section";

export interface SerializerInterface {
    serializeMicroBlock(microBlock: MicroBlock): Uint8Array,
    unserializeMicroBlock(stream: Uint8Array): MicroBlock,
    serializeSection(section: Section): Uint8Array,
    unserializeSection(stream: Uint8Array): Section,
}