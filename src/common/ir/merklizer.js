import { PathManager } from "./pathManager.js";
import { Utf8Encoder } from "./utf8Encoder.js";
import { MerkleTree } from "./merkleTree.js";
import * as crypto from "../crypto/crypto.js";
import * as uint8 from "../util/uint8.js";
import { DATA } from "./constants/constants.js";

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

    return witnesses.map(arr => uint8.toHexa(arr)).join("");
  }
}

export class PepperMerklizer extends Merklizer {
  constructor(pepper) {
    super();
    this.pepper = pepper;
    this.saltCounter = 0;
    this.leaves = [];
  }

  static generatePepper() {
    return crypto.getRandomBytes(32);
  }

  addLeaf(item, data) {
    this.leaves.push({
      item: item,
      hash: crypto.sha256AsBinary(data)
    });
  }

  generateTree() {
    this.nLeaves = this.leaves.length;
    this.leaves.sort((a, b) => uint8.compare(a.hash, b.hash));

    for(const n in this.leaves) {
      this.tree.addLeaf(this.leaves[+n].hash);
      this.leaves[+n].item.leafIndex = +n;
    }

    this.tree.finalize();

    const rootHash = this.tree.getRootHash();

    return {
      nLeaves: this.leaves.length,
      rootHash: uint8.toHexa(rootHash),
      pepper: uint8.toHexa(this.pepper)
    };
  }

  addRawItem(item, info) {
    const salt = this.getSalt();

    item.salt = uint8.toHexa(salt);
    this.addLeaf(item, uint8.from(salt, info, item.valueBinary));
  }

  addHashableItem(item, info) {
    const salt = this.getSalt(),
          hash = crypto.sha256AsBinary(item.valueBinary);

    item.hash = uint8.toHexa(hash);
    item.salt = uint8.toHexa(salt);
    this.addLeaf(item, uint8.from(salt, info, hash));
  }

  addMaskableItem(item, info) {
    const visibleSalt = this.getSalt(),
          visibleHash = crypto.sha256AsBinary(uint8.from(visibleSalt, info, item.visiblePartsBinary)),
          hiddenSalt = this.getSalt(),
          hiddenHash = crypto.sha256AsBinary(uint8.from(hiddenSalt, item.hiddenPartsBinary));

    item.visibleSalt = uint8.toHexa(visibleSalt);
    item.hiddenSalt = uint8.toHexa(hiddenSalt);
    item.hiddenHash = uint8.toHexa(hiddenHash);
    this.addLeaf(item, uint8.from(visibleHash, hiddenHash));
  }

  getSalt() {
    const n = this.saltCounter & 3,
          k = this.saltCounter++ >> 2;

    if(!n) {
      this.sha512 = crypto.sha512AsBinary(uint8.from(this.pepper, k));
    }
    return this.sha512.slice(n << 4, (n + 1) << 4);
  }
}

export class SaltMerklizer extends Merklizer {
  constructor(nLeaves, witnesses) {
    super();
    this.nLeaves = nLeaves;
    this.witnesses = (witnesses.match(/.{64}/g) || []).map(s => uint8.fromHexa(s));
  }

  addLeaf(item, data) {
    this.tree.setLeaf(item.leafIndex, crypto.sha256AsBinary(data));
  }

  generateTree() {
    this.tree.finalize(this.nLeaves);
    this.tree.setWitnesses(this.witnesses);

    const rootHash = this.tree.getRootHash();

    return {
      nLeaves: this.tree.getNumberOfLeaves(),
      rootHash: uint8.toHexa(rootHash)
    };
  }

  addRawItem(item, info) {
    const salt = uint8.fromHexa(item.salt);

    this.addLeaf(item, uint8.from(salt, info, item.valueBinary));
  }

  addHashableItem(item, info) {
    const salt = uint8.fromHexa(item.salt);

    let hash;

    if(item.hash) {
      hash = uint8.fromHexa(item.hash);
    }
    else {
      hash = crypto.sha256AsBinary(item.valueBinary);
      item.hash = hash;
    }

    this.addLeaf(item, uint8.from(salt, info, item.valueBinary));
  }

  addMaskableItem(item, info) {
    const visibleSalt = uint8.fromHexa(item.visibleSalt),
          visibleHash = crypto.sha256AsBinary(uint8.from(visibleSalt, info, item.visiblePartsBinary));

    let hiddenHash;

    if(item.hiddenHash) {
      hiddenHash = uint8.fromHexa(item.hiddenHash);
    }
    else {
      const hiddenSalt = uint8.fromHexa(item.hiddenSalt);

      hiddenHash = crypto.sha256AsBinary(uint8.from(hiddenSalt, item.hiddenPartsBinary));
      item.hiddenHash = uint8.toHexa(hiddenHash);
    }

    this.addLeaf(item, uint8.from(visibleHash, hiddenHash));
  }
}
