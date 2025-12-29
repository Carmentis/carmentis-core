import * as val from 'valibot';
import {uint8array} from "../../primitives";
import {MAGIC_STRING} from "../../../../constants/chain";


export const MicroblockHeaderSchema = val.object({
    magicString: val.literal(MAGIC_STRING),
    protocolVersion: val.number(),
    microblockType: val.number(),
    height: val.number(),
    previousHash: uint8array(),
    timestamp: val.number(),
    gas: val.number(),
    gasPrice: val.number(),
    bodyHash: uint8array(),
    feesPayerAccount: uint8array()
})

export type MicroblockHeader = val.InferOutput<typeof MicroblockHeaderSchema>;
