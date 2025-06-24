import { PathManager } from "./pathManager.js";
import { MerkleTree } from "../trees/merkleTree.js";
import { Crypto } from "../crypto/crypto.js";
import { Utils } from "../utils/utils.js";
import { Utf8Encoder } from "../data/utf8Encoder.js";
import { DATA } from "../constants/constants.js";

class Merklizer {
  constructor() {
    this.tree = new MerkleTree;
  }

  addItem(item, parents) {
    const info = this.getLeafInfo(item, parents);

    if(item.attributes & DATA.MASKABLE) {
      this.addMaskableItem(item, info);
    }
    else if(item.attributes & DATA.HASHABLE) {
      this.addHashableItem(item, info);
    }
    else {
      this.addRawItem(item, info);
    }
  }

  getLeafInfo(item, parents) {
    const path = PathManager.fromParents(parents),
          utf8Path = Utf8Encoder.encode(path);

    if(utf8Path.length > 0xFFFF) {
      throw "path too long";
    }

    const info = new Uint8Array(utf8Path.length + 3);

    info[0] = item.type;
    info[1] = utf8Path.length >> 8;
    info[2] = utf8Path.length & 0xFF;
    info.set(utf8Path, 3);

    return info;
  }

  getWitnesses(knownPositions) {
    const unknownPositions = [];

    for(let index = 0; index < this.nLeaves; index++) {
      if(!knownPositions.has(index)) {
        unknownPositions.push(index);
      }
    }

    const witnesses = this.tree.getWitnesses(unknownPositions);

    return witnesses.map((arr) => Utils.binaryToHexa(arr)).join("");
  }
}

export class PepperMerklizer extends Merklizer {
  constructor(pepper) {
    super();
    this.pepper = pepper || this.constructor.generatePepper();
    this.saltCounter = 0;
    this.leaves = [];
  }

  static generatePepper() {
    return Crypto.Random.getBytes(32);
  }

  addLeaf(item, data) {
    this.leaves.push({
      item: item,
      hash: Crypto.Hashes.sha256AsBinary(data)
    });
  }

  generateTree() {
    this.nLeaves = this.leaves.length;
    this.leaves.sort((a, b) => Utils.binaryCompare(a.hash, b.hash));

    for(const n in this.leaves) {
      this.tree.addLeaf(this.leaves[+n].hash);
      this.leaves[+n].item.leafIndex = +n;
    }

    this.tree.finalize();

    const rootHash = this.tree.getRootHash();

    return {
      nLeaves: this.leaves.length,
      rootHash: Utils.binaryToHexa(rootHash),
      pepper: Utils.binaryToHexa(this.pepper)
    };
  }

  addRawItem(item, info) {
    const salt = this.getSalt();

    item.salt = Utils.binaryToHexa(salt);
    this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
  }

  addHashableItem(item, info) {
    const salt = this.getSalt(),
          hash = Crypto.Hashes.sha256AsBinary(item.valueBinary);

    item.hash = Utils.binaryToHexa(hash);
    item.salt = Utils.binaryToHexa(salt);
    this.addLeaf(item, Utils.binaryFrom(salt, info, hash));
  }

  addMaskableItem(item, info) {
    const visibleSalt = this.getSalt(),
          visibleHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(visibleSalt, info, item.visiblePartsBinary)),
          hiddenSalt = this.getSalt(),
          hiddenHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(hiddenSalt, item.hiddenPartsBinary));

    item.visibleSalt = Utils.binaryToHexa(visibleSalt);
    item.hiddenSalt = Utils.binaryToHexa(hiddenSalt);
    item.hiddenHash = Utils.binaryToHexa(hiddenHash);
    this.addLeaf(item, Utils.binaryFrom(visibleHash, hiddenHash));
  }

  getSalt() {
    const n = this.saltCounter & 3,
          k = this.saltCounter++ >> 2;

    if(!n) {
      this.sha512 = Crypto.Hashes.sha512AsBinary(Utils.binaryFrom(this.pepper, k));
    }
    return this.sha512.slice(n << 4, (n + 1) << 4);
  }
}

export class SaltMerklizer extends Merklizer {
  constructor(nLeaves, witnesses) {
    super();
    this.nLeaves = nLeaves;
    this.witnesses = (witnesses.match(/.{64}/g) || []).map((s) => Utils.binaryFromHexa(s));
  }

  addLeaf(item, data) {
    this.tree.setLeaf(item.leafIndex, Crypto.Hashes.sha256AsBinary(data));
  }

  generateTree() {
    this.tree.finalize(this.nLeaves);
    this.tree.setWitnesses(this.witnesses);

    const rootHash = this.tree.getRootHash();

    return {
      nLeaves: this.tree.getNumberOfLeaves(),
      rootHash: Utils.binaryToHexa(rootHash)
    };
  }

  addRawItem(item, info) {
    const salt = Utils.binaryFromHexa(item.salt);

    this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
  }

  addHashableItem(item, info) {
    const salt = Utils.binaryFromHexa(item.salt);

    let hash;

    if(item.hash) {
      hash = Utils.binaryFromHexa(item.hash);
    }
    else {
      hash = Crypto.Hashes.sha256AsBinary(item.valueBinary);
      item.hash = hash;
    }

    this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
  }

  addMaskableItem(item, info) {
    const visibleSalt = Utils.binaryFromHexa(item.visibleSalt),
          visibleHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(visibleSalt, info, item.visiblePartsBinary));

    let hiddenHash;

    if(item.hiddenHash) {
      hiddenHash = Utils.binaryFromHexa(item.hiddenHash);
    }
    else {
      const hiddenSalt = Utils.binaryFromHexa(item.hiddenSalt);

      hiddenHash = Crypto.Hashes.sha256AsBinary(Utils.binaryFrom(hiddenSalt, item.hiddenPartsBinary));
      item.hiddenHash = Utils.binaryToHexa(hiddenHash);
    }

    this.addLeaf(item, Utils.binaryFrom(visibleHash, hiddenHash));
  }
}
