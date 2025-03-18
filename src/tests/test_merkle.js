import * as merkle from "../common/trees/merkle.js";

const HEADER_SIZE = 4;
const HASH_SIZE   = 32;

const indexList = [ 0, 1, 2 ];
const knownHash = [
  new Uint8Array([
    174, 134, 238, 177, 202,  47, 174, 119,
     67,  71, 245, 150, 156,  16,  12,  52,
    120, 150,  97,  28, 141, 204,  74,   2,
    183, 189, 186, 199,  49, 159,  77, 171
  ]),
  new Uint8Array([
    130, 154, 48, 138,  76, 121,  32, 101,
    242,  13, 50,  56,  87, 190, 195, 222,
    182, 113, 40, 176, 111,  80, 176,  82,
    182,  60, 64, 189, 202,   1, 203,  83
  ]),
  new Uint8Array([
    143,  93, 165,  91,  33,  62, 183,  97,
    253,  74,   7, 117, 201,  54, 152, 187,
     54, 114,  36, 117,  27, 120,  61,   7,
    114, 170,  12,  97,  71,  86, 232, 220
  ])
];

const proof = new Uint8Array([ 0, 0, 0, 3 ]);

console.log(merkle.applyProof(indexList, knownHash, proof));
console.log(applyProof(indexList, knownHash, proof));

function applyProof(indexList, knownHash, proof) {
    var nLeaf = getNumberOfLeaves(proof), tree = initializeTree(nLeaf); getWitnessHashPositions(tree, indexList); var hash = __spreadArray([], Array(tree.depth), true).map(function (_) { return []; }), ptr = 0;
    tree.emptyNode.forEach(function (index, depth) {
        if (~index) {
            hash[depth][index] = new Uint8Array(HASH_SIZE);
        }
    });
    indexList.forEach(function (index, n) {
        hash[tree.depth - 1][index] = knownHash[n];
    });
    function getHash(depth, index) {
        return hash[depth][index] || proof.slice(HEADER_SIZE + ptr++ * HASH_SIZE, HEADER_SIZE + ptr * HASH_SIZE);
    }
    for (var depth = tree.depth; --depth > 0;) {
        var processed = new Set(), list = __spreadArray([], tree.knownHash[depth], true).sort(function (index0, index1) { return index0 - index1; });
        //  console.log("depth " + depth);
        for (var _i = 0, list_1 = list; _i < list_1.length; _i++) {
            var index = list_1[_i];
            index &= -2;
            if (!processed.has(index)) {
                var leftHash = getHash(depth, index), rightHash = getHash(depth, index ^ 1);
                //      console.log([ depth - 1, index >> 1 ], "=", [ depth, index ], leftHash, "+", [ depth, index ^ 1 ], rightHash);
                hash[depth - 1][index >> 1] = hashMerge(leftHash, rightHash);
                processed.add(index);
            }
        }
    }
    return hash[0][0];
}

function getNumberOfLeaves(treeData) {
    return treeData[0] << 24 | treeData[1] << 16 | treeData[2] << 8 | treeData[3];
}
function hashMerge(h0, h1) {
    var hashConcat = new Uint8Array(HASH_SIZE * 2);
    hashConcat.set(h0);
    hashConcat.set(h1, HASH_SIZE);
    return sha256AsBinary(hashConcat);
}

function initializeTree(nLeaf) {
    var depth = nLeaf && Math.ceil(Math.log2(nLeaf)) + 1;
    var tree = {
        depth: depth,
        rowOffset: Array(depth),
        knownHash: Array(depth),
        emptyNode: Array(depth)
    };
    var ptr = HEADER_SIZE;
    (function buildRowOffsets(width, depth) {
        if (depth >= 0) {
            tree.knownHash[depth] = new Set;
            tree.emptyNode[depth] = -1;
            if (width > 1) {
                if (width & 1) {
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

function getWitnessHashPositions(tree, indexList) {
    var witnessHash = [];
    indexList.forEach(function (index) {
        tree.knownHash[tree.depth - 1].add(index);
    });
    var _loop_1 = function (d) {
        __spreadArray([], tree.knownHash[d], true).sort(function (index0, index1) { return index0 - index1; }).forEach(function (index) {
            if (!tree.knownHash[d].has(index ^ 1)) {
                witnessHash.push([d, index ^ 1]);
            }
            tree.knownHash[d - 1].add(index >> 1);
        });
    };
    for (var d = tree.depth; --d > 0;) {
        _loop_1(d);
    }
    return witnessHash;
}
