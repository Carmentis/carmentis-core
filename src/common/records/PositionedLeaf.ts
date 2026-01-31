import {MerkleLeaf} from "./MerkleLeaf";

export type PositionedLeaf = {
    leaf: MerkleLeaf,
    index: number,
    path: (string | number)[]
}
