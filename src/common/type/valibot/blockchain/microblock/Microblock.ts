import * as val from 'valibot';
import {MicroblockHeaderSchema} from "./MicroblockHeader";
import {SectionSchema} from "../section/sections";

export const MicroblockSchema = val.object({
    header: MicroblockHeaderSchema,
    body: val.array(SectionSchema)
})
export type Microblock = val.InferOutput<typeof MicroblockSchema>;