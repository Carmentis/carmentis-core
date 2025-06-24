// @ts-expect-error TS(2307): Cannot find module './merkleTree.js' or its corres... Remove this comment to see the full error message
import { MerkleTree } from "./merkleTree";
import { Utils } from "./utils/utils";
import { Crypto } from "./crypto/crypto";

for(let size = 1; size <= 16; size++) {
  console.log(`Testing tree of size ${size}`);

  const tree = new MerkleTree;

  for(let n = 0; n < size; n++) {
    tree.addLeaf(Crypto.Hashes.sha256AsBinary(new Uint8Array([ Math.random() * 0x100, Math.random() * 0x100 ])));
  }
  tree.finalize();

  const rootHash = Utils.binaryToHexa(tree.getRootHash());

  for(let n = 0; n < (1 << size); n++) {
    const missing = [...Array(size)].map((_, i) => i).filter((i) => n >> i & 1);
    // @ts-expect-error TS(7031): Binding element 'i' implicitly has an 'any' type.
    const knownHashes = tree.tree[0].map((h: any, i: any) => [ i, h ]).filter(([i]) => !(n >> i & 1));
    const witnesses = tree.getWitnesses(missing);

    const newTree = new MerkleTree;

    for(const [ index, hash ] of knownHashes) {
      newTree.setLeaf(index, hash);
    }
    newTree.finalize(size);
    newTree.setWitnesses(witnesses);

    const newRootHash = Utils.binaryToHexa(newTree.getRootHash());

    if(newRootHash != rootHash) {
      throw "FAILED: invalid root hash";
    }
  }
}
