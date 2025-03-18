import { DATA } from "../constants/constants.js";
import * as fieldSerializer from "../serializers/field-serializer.js";
import * as crypto from "../crypto/crypto.js";
import * as merkle from "../trees/merkle.js";
import * as uint8 from "../util/uint8.js";
import * as debug from "../util/debug.js";

export class fieldMerklizer {
  constructor(pepper) {
    this.pepper = pepper || crypto.getRandomBytes(DATA.MERKLE_PEPPER_SIZE);
    this.treeStack = [];
    this.saltCounter = 0;

    this.createTree();
  }

  getPepper() {
    return this.pepper;
  }

  add(data, reference) {
    this.currentTree.add(data, reference);
  }

  addUndefined(data, reference) {
    this.currentTree.addUndefined(data, reference);
  }

  enterSubTree(reference) {
    this.createTree(reference);
  }

  leaveSubTree() {
    if(this.treeStack.length <= 1) {
      throw "Internal error: invalid call to fieldMerklizer.leaveSubTree()";
    }

    let subTreeData = this.currentTree.generate();

    this.treeStack.pop();
    this.currentTree = this.treeStack[this.treeStack.length - 1];
    this.currentTree.addSubTree(subTreeData);
  }

  generate() {
    if(this.treeStack.length != 1) {
      throw "Internal error: fieldMerklizer.generate() was not called at the root";
    }

    let treeData = this.currentTree.generate();

//  console.log(JSON.stringify(treeData));

    return treeData;
  }

  createTree(parentReference = null) {
    let tree = merkle.newTree(),
        leaves = [];

    let treeObject = {
      add: (data, reference = null) => {
        let salt = this.getSalt(1),
            leaf = uint8.from(salt, data);

        tree.add(leaf);

        leaves.push({
          data: leaf,
          reference: reference
        });
      },

      addUndefined: (reference = null) => {
        let salt = this.getSalt(0);

        tree.add(salt);

        leaves.push({
          data: salt,
          reference: reference
        });
      },

      addSubTree: subTreeData => {
        let salt = this.getSalt(1),
            leaf = uint8.from(salt, subTreeData.hash);

        tree.add(leaf);
        subTreeData.salt = salt;
        leaves.push(subTreeData);
      },

      generate: _ => {
        let merkleData = tree.generate();

        return {
          isTree: true,
          leaves: leaves,
          hash: merkleData.slice(4, 36),
          merkleData: merkleData,
          reference: parentReference
        };
      }
    };

    this.currentTree = treeObject;
    this.treeStack.push(treeObject);
  }

  getSalt(defined) {
    let salt;

    if(this.saltCounter++ & 1) {
      salt = this.nextSalt;
    }
    else {
      let hash = crypto.sha256AsBinary(uint8.from(this.pepper, this.saltCounter >> 1));

      this.nextSalt = hash.slice(DATA.MERKLE_SALT_SIZE);
      salt = hash.slice(0, DATA.MERKLE_SALT_SIZE);
    }

    salt[0] = salt[0] & 0x7F | (defined ? 0x80 : 0x00);

    return salt;
  }
}

export class proofGenerator {
  constructor(treeData) {
//  console.log("treeData", debug.jsonDump(treeData));
    this.treeData = treeData;
  }

  generate(callback) {
    if(this.treeData === null) {
      return { provable: 0 };
    }

    let modeMap = new Map;

    let output = {
      provable: 1,
      modeList: [],
      dataList: [],
      proofList: []
    };

    scan(this.treeData);

    function scan(node) {
      let indexList = [],
          proofNdx = output.proofList.push(null) - 1;

      node.leaves.forEach((leaf, ndx) => {
        // turn the reference into a string key
        let key = leaf.reference.toString();

        if(!modeMap.has(key)) {
          // if we don't already know the mode for this field reference, get it from the caller
          modeMap.set(key, callback(leaf.reference) | (leaf.isTree && DATA.TREE));
        }

        let mode = modeMap.get(key);

        output.modeList.push(mode);

        switch(mode & DATA.MSK_ACCESS) {
          case DATA.PLAIN: {
            if(leaf.isTree) {
              // if this is a sub-tree, reveal the salt that must be added to its root Merkle hash
              output.dataList.push(leaf.salt);
            }
            else {
              // if this is a leaf, reveal the 'data' property (which already includes the salt)
              output.dataList.push(leaf.data);
            }
            indexList.push(ndx);
            break;
          }
          case DATA.MASKED: {
            break;
          }
          case DATA.HASHED: {
            break;
          }
          case DATA.MASKED | DATA.HASHED: {
            break;
          }
          case DATA.REDACTED: {
            // nothing to reveal
            break;
          }
        }

        if(leaf.isTree) {
          scan(leaf);
        }
      });

      let proof = merkle.buildProof(indexList, node.merkleData);

      output.proofList[proofNdx] = proof;
    }

    return output;
  }
}

export class proofDecoder {
  constructor(proofData) {
//  console.log("proofData", debug.jsonDump(proofData));
    this.proofData = proofData;
  }

  decode() {
    let proofData = this.proofData;

    if(!proofData.provable) {
      return null;
    }

    let stream = fieldSerializer.getWriteStream(),
        proofPtr = 0,
        dataPtr = 0,
        modePtr = 0;

    let merkleRootHash = uint8.toHexa(scanNode());

    return {
      merkleRootHash: merkleRootHash,
      data: stream.getContent()
    };

    function scanNode() {
      let proof = proofData.proofList[proofPtr++],
          nLeaf = proof[0] << 24 | proof[1] << 16 | proof[2] << 8 | proof[3],
          indexList = [],
          knownHash = [];

      console.log(`scanNode() nLeaf: ${nLeaf}, modePtr:${modePtr}, dataPtr:${dataPtr}, proofPtr:${proofPtr}`);

      for(let ndx = 0; ndx < nLeaf; ndx++) {
        let mode = proofData.modeList[modePtr++];

        switch(mode & DATA.MSK_ACCESS) {
          case DATA.PLAIN: {
            if(mode & DATA.TREE) {
              let salt = proofData.dataList[dataPtr++];

              stream.writeUnsigned(mode | (salt[0] & 0x80 ? 0 : DATA.MISSING), 1);

              let hash = scanNode(),
                  data = uint8.from(salt, hash);

              knownHash.push(crypto.sha256AsBinary(data));
            }
            else {
              let data = proofData.dataList[dataPtr++];

              stream.writeUnsigned(mode | (data[0] & 0x80 ? 0 : DATA.MISSING), 1);
              stream.writeArray(data.slice(16));
              knownHash.push(crypto.sha256AsBinary(data));
            }
            indexList.push(ndx);
            break;
          }
          case DATA.MASKED: {
            break;
          }
          case DATA.HASHED: {
            break;
          }
          case DATA.MASKED | DATA.HASHED: {
            break;
          }
          case DATA.REDACTED: {
            stream.writeUnsigned(mode, 1);
            break;
          }
        }
      }

console.log("indexList", indexList);
console.log("knownHash", knownHash);
console.log("proof", proof);

      let rootHash = merkle.applyProof(indexList, knownHash, proof);

console.log("rootHash", rootHash);

      return rootHash;
    }
  }
}
