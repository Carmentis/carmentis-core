import {z} from "zod";

const PositiveInt = z.number().int().gt(0);
type PositiveInt = z.infer<typeof PositiveInt>;

/**
 * Defines the height in a (virtual) blockchain.
 *
 * Both the height of a block in the blockchain and a micro-block in a virtual blockchain is a strictly positive integer
 * starting at 1 for the first block.
 */
export type Height = PositiveInt;