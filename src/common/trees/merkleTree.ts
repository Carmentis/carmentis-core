import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";

export class MerkleTree {
  leaves: any;
  nLeaves: any;
  tree: any;
  constructor() {
    this.leaves = [];
  }

  addLeaf(hash: any) {
    this.checkHash(hash);
    this.leaves.push(hash);
  }

  setLeaf(index: any, hash: any) {
    this.checkHash(hash);
    this.leaves[index] = hash;
  }

  checkHash(hash: any) {
    if(!(hash instanceof Uint8Array) || hash.length != 32) {
      throw "invalid hash";
    }
  }

  finalize(nLeaves: any) {
    this.nLeaves = nLeaves === undefined ? this.leaves.length : nLeaves;
    this.buildTreeStructure();
  }

  getNumberOfLeaves() {
    return this.nLeaves;
  }

  getRootHash() {
    const rootDepth = this.tree.length - 1;

    for(let depth = 0; depth < rootDepth; depth++) {
      const row = this.tree[depth];

      for(let index = 0; index < row.length; index += 2) {
        if(row[index] && row[index + 1]) {
          this.tree[depth + 1][index >> 1] = this.mergeHashes(depth + 1, row[index], row[index + 1]);
        }
      }
    }
    return this.tree[rootDepth][0];
  }

  getWitnesses(unknownPositions: any) {
    const unknownPositionSet = new Set(unknownPositions),
          witnessPositions = this.getWitnessPositions(unknownPositionSet),
          witnesses = [];

    for(let index = 0; index < this.tree[0].length; index++) {
      if(!unknownPositionSet.has(index) && !this.tree[0][index]) {
        throw `cannot find leaf at index ${index}`;
      }
    }

    for(const [ depth, index ] of witnessPositions) {
      const witness = this.tree[depth][index];

      if(!witness) {
        throw `cannot find witness hash at depth ${depth}, index ${index}`;
      }
      witnesses.push(witness);
    }
    return witnesses;
  }

  setWitnesses(witnesses: any) {
    const unknownPositionSet = new Set;

    for(let index = 0; index < this.nLeaves; index++) {
      if(!this.leaves[index]) {
        unknownPositionSet.add(index);
      }
    }

    const witnessPositions = this.getWitnessPositions(unknownPositionSet);

    if(witnesses.length != witnessPositions.length) {
      throw "invalid witness list";
    }

    let ptr = 0;

    for(const [ depth, index ] of witnessPositions) {
      this.checkHash(witnesses[ptr]);
      this.tree[depth][index] = witnesses[ptr++];
    }
  }

  buildTreeStructure() {
    let nLeaves = this.nLeaves;

    this.tree = [];

    while(nLeaves) {
      const row = Array(nLeaves).fill(null);

      if(nLeaves > 1 && nLeaves & 1) {
        row.push(Utils.getNullHash());
        nLeaves++;
      }
      this.tree.push(row);
      nLeaves >>= 1;
    }

    for(let index = 0; index < this.nLeaves; index++) {
      if(this.leaves[index]) {
        this.tree[0][index] = this.leaves[index];
      }
    }
  }

  getWitnessPositions(unknownPositionSet: any) {
    let nLeaves = this.nLeaves;
    const witnessPositions = [];

    for(let depth = 0; nLeaves; depth++) {
      const newUnknownPositionSet = new Set;

      for(let index = 0; index < nLeaves; index += 2) {
        const unknownLeft = unknownPositionSet.has(index),
              unknownRight = index + 1 < nLeaves && unknownPositionSet.has(index + 1);

        if(unknownLeft && unknownRight) {
          newUnknownPositionSet.add(index >> 1);
        }
        else if(unknownLeft || unknownRight) {
          witnessPositions.push([ depth, index + unknownRight ]);
        }
      }
      unknownPositionSet = newUnknownPositionSet;
      nLeaves = nLeaves + (nLeaves > 1) >> 1;
    }
    return witnessPositions;
  }

  mergeHashes(depth: any, left: any, right: any) {
    const data = new Uint8Array(65);

    data[0] = +(depth == this.tree.length - 1);
    data.set(left, 1);
    data.set(right, 33);

    return Crypto.Hashes.sha256AsBinary(data);
  }
}
