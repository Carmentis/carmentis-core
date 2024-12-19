import * as crypto from "../crypto/crypto.js";

// ============================================================================================================================ //
//  Merkle trees                                                                                                                //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  We add at most one padding hash to each row of the tree to get an even number of elements on each of them. For instance,    //
//  with 9 leaf nodes, we get:                                                                                                  //
//                                                                                                                              //
//    (0)            ____ K ____                                                                                                //
//                  /           \                                                                                               //
//    (1)         I               J                                                                                             //
//              /   \           /   \            0-8 : leaf hashes                                                              //
//    (2)     F       G       H       #          A-K : parent hashes (with K = root hash)                                       //
//           / \     / \     / \                   # : padding hash                                                             //
//    (3)   A   B   C   D   E   #   -   -          - : ignored and not stored                                                   //
//         / \ / \ / \ / \ / \                                                                                                  //
//    (4)  0 1 2 3 4 5 6 7 8 # - - - - - -                                                                                      //
//                                                                                                                              //
//  The hashes are stored from top to bottom and left to right. (So, the above tree is stored as 'KIJFGH#ABCDE#012345678#'.)    //
//  Padding hashes are set to all 0's.                                                                                          //
// ============================================================================================================================ //

const HEADER_SIZE = 4;
const HASH_SIZE   = 32;

// ============================================================================================================================ //
//  newTree()                                                                                                                   //
// ============================================================================================================================ //
export function newTree() {
  let leafHash = [];

  return {
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  add()                                                                                                                   //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Adds the hash of the given data block to the list of leaf hashes.                                                       //
    // ------------------------------------------------------------------------------------------------------------------------ //
    add: function(data) {
      let hash = crypto.sha256AsBinary(data);

      leafHash.push(hash);
      return hash;
    },

    // ------------------------------------------------------------------------------------------------------------------------ //
    //  generate()                                                                                                              //
    // ------------------------------------------------------------------------------------------------------------------------ //
    //  Generates the tree from the list of leaf hashes.                                                                        //
    // ------------------------------------------------------------------------------------------------------------------------ //
    generate: function() {
      let nLeaf    = leafHash.length,
          tree     = initializeTree(nLeaf),
          treeData = new Uint8Array(tree.size),
          ptr      = HEADER_SIZE;

      treeData[0] = nLeaf >> 24 & 0xFF;
      treeData[1] = nLeaf >> 16 & 0xFF;
      treeData[2] = nLeaf >> 8  & 0xFF;
      treeData[3] = nLeaf       & 0xFF;

      (function build(list) {
        if(list.length > 1) {
          if(list.length & 1) {
            list.push(new Uint8Array(HASH_SIZE));
          }

          let newList = [];

          for(let i = 0; i < list.length; i += 2) {
            newList.push(hashMerge(list[i], list[i + 1]));
          }
          build(newList);
        }
        list.forEach(hash => {
          treeData.set(hash, ptr);
          ptr += HASH_SIZE;
        });
      })(leafHash);

      return treeData;
    }
  };
}

// ============================================================================================================================ //
//  initializeTree()                                                                                                            //
// ============================================================================================================================ //
function initializeTree(nLeaf) {
  let depth = nLeaf && Math.ceil(Math.log2(nLeaf)) + 1;

  let tree = {
    depth    : depth,
    rowOffset: Array(depth),
    knownHash: Array(depth),
    emptyNode: Array(depth)
  };

  let ptr = HEADER_SIZE;

  (function buildRowOffsets(width, depth) {
    if(depth >= 0) {
      tree.knownHash[depth] = new Set;
      tree.emptyNode[depth] = -1;

      if(width > 1) {
        if(width & 1) {
          tree.knownHash[depth].add(width);
          tree.emptyNode[depth] = width++;
        }
        buildRowOffsets(width >> 1, depth - 1);
      }
      tree.rowOffset[depth] = ptr;
      ptr += width * HASH_SIZE;
    }
  })(nLeaf, tree.depth - 1);

  tree.size = ptr;

  return tree;
}

// ============================================================================================================================ //
//  getWitnessHashPositions()                                                                                                   //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Given a tree and the list of indices of the revealed leaves, returns a list of [ depth, index ] entries representing the    //
//  positions of the witness hashes.                                                                                            //
// ============================================================================================================================ //
function getWitnessHashPositions(tree, indexList) {
  let witnessHash = [];

  indexList.forEach(index => {
    tree.knownHash[tree.depth - 1].add(index);
  });

  for(let d = tree.depth; --d > 0;) {
    [...tree.knownHash[d]].sort((index0, index1) => index0 - index1).forEach(index => {
      if(!tree.knownHash[d].has(index ^ 1)) {
        witnessHash.push([d, index ^ 1]);
      }
      tree.knownHash[d - 1].add(index >> 1);
    });
  }

  return witnessHash;
}

// ============================================================================================================================ //
//  buildProof()                                                                                                                //
// ============================================================================================================================ //
export function buildProof(treeData, indexList) {
  let nLeaf       = getNumberOfLeaves(treeData),
      tree        = initializeTree(nLeaf),
      witnessHash = getWitnessHashPositions(tree, indexList);

  indexList.sort((index0, index1) => index0 - index1);

  let proof = new Uint8Array(HEADER_SIZE + witnessHash.length * HASH_SIZE);

  proof[0] = nLeaf >> 24 & 0xFF;
  proof[1] = nLeaf >> 16 & 0xFF;
  proof[2] = nLeaf >> 8  & 0xFF;
  proof[3] = nLeaf       & 0xFF;

  witnessHash.forEach(([ depth, index ], n) => {
    let pos = tree.rowOffset[depth] + index * HASH_SIZE;

    proof.set(treeData.slice(pos, pos + HASH_SIZE), HEADER_SIZE + n * HASH_SIZE);
  });

  return proof;
}

// ============================================================================================================================ //
//  applyProof()                                                                                                                //
// ============================================================================================================================ //
export function applyProof(indexList, knownHash, proof) {
  let nLeaf       = getNumberOfLeaves(proof),
      tree        = initializeTree(nLeaf),
      witnessHash = getWitnessHashPositions(tree, indexList),
      hash        = [...Array(tree.depth)].map(_ => []),
      ptr         = 0;

  tree.emptyNode.forEach((index, depth) => {
    if(~index) {
      hash[depth][index] = new Uint8Array(HASH_SIZE);
    }
  });

  indexList.forEach((index, n) => {
    hash[tree.depth - 1][index] = knownHash[n];
  });

  function getHash(depth, index) {
    return hash[depth][index] || proof.slice(HEADER_SIZE + ptr++ * HASH_SIZE, HEADER_SIZE + ptr * HASH_SIZE);
  }

  for(let depth = tree.depth; --depth > 0;) {
    let processed = new Set(),
        list = [...tree.knownHash[depth]].sort((index0, index1) => index0 - index1);

//  console.log("depth " + depth);

    for(let index of list) {
      index &= ~1;

      if(!processed.has(index)) {
        let leftHash = getHash(depth, index),
            rightHash = getHash(depth, index ^ 1);

//      console.log([ depth - 1, index >> 1 ], "=", [ depth, index ], leftHash, "+", [ depth, index ^ 1 ], rightHash);

        hash[depth - 1][index >> 1] = hashMerge(leftHash, rightHash);
        processed.add(index);
      }
    }
  }

  return hash[0][0];
}

// ============================================================================================================================ //
//  getNumberOfLeaves()                                                                                                         //
// ============================================================================================================================ //
function getNumberOfLeaves(treeData) {
  return treeData[0] << 24 | treeData[1] << 16 | treeData[2] << 8 | treeData[3];
}

// ============================================================================================================================ //
//  hashMerge()                                                                                                                 //
// ============================================================================================================================ //
function hashMerge(h0, h1) {
  let hashConcat = new Uint8Array(HASH_SIZE * 2);

  hashConcat.set(h0);
  hashConcat.set(h1, HASH_SIZE);

  return crypto.sha256AsBinary(hashConcat);
}
