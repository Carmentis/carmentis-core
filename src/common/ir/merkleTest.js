import { merkleTree } from "./merkleTree.js";
import * as crypto from "../crypto/crypto.js";
import * as uint8 from "../util/uint8.js";

for(let size = 1; size <= 16; size++) {
  console.log(`Testing tree of size ${size}`);

  const tree = new merkleTree;

  for(let n = 0; n < size; n++) {
    tree.addLeaf(crypto.sha256AsBinary(new Uint8Array([ Math.random() * 0x100, Math.random() * 0x100 ])));
  }
  tree.finalize();

  const rootHash = uint8.toHexa(tree.getRootHash());

  for(let n = 0; n < (1 << size); n++) {
    const missing = [...Array(size)].map((_, i) => i).filter(i => n >> i & 1);
    const knownHashes = tree.tree[0].map((h, i) => [ i, h ]).filter(([i]) => !(n >> i & 1));
    const witnesses = tree.getWitnesses(missing);

    const newTree = new merkleTree;

    for(const [ index, hash ] of knownHashes) {
      newTree.setLeaf(index, hash);
    }
    newTree.finalize(size);
    newTree.setWitnesses(witnesses);

    const newRootHash = uint8.toHexa(newTree.getRootHash());

    if(newRootHash != rootHash) {
      throw "FAILED: invalid root hash";
    }
  }
}
