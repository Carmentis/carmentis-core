import { PathManager } from "./pathManager";
import { MerkleTree } from "../trees/merkleTree";
import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";
import { Utf8Encoder } from "../data/utf8Encoder";
import { DATA } from "../constants/constants";

abstract class Merklizer {
  //addHashableItem: any;
  //addMaskableItem: any;
  //addRawItem: any;

  nLeaves: any;
  tree: any;
  constructor() {
    this.tree = new MerkleTree;
  }

  abstract addHashableItem(item: any, info: any): void;
  abstract addMaskableItem(item: any, info: any): void;
  abstract addRawItem(item: any, info: any): void;

  addItem(item: any, parents: any) {
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

  getLeafInfo(item: any, parents: any) {
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

  getWitnesses(knownPositions: any) {
    const unknownPositions = [];

    for(let index = 0; index < this.nLeaves; index++) {
      if(!knownPositions.has(index)) {
        unknownPositions.push(index);
      }
    }

    const witnesses = this.tree.getWitnesses(unknownPositions);

    return witnesses.map((arr: any) => Utils.binaryToHexa(arr)).join("");
  }
}

export class PepperMerklizer extends Merklizer {
  leaves: any;
  pepper: any;
  saltCounter: any;
  sha512: any;
  constructor(pepper: any) {
    super();
    // @ts-expect-error TS(2339): Property 'generatePepper' does not exist on type '... Remove this comment to see the full error message
    this.pepper = pepper || this.constructor.generatePepper();
    this.saltCounter = 0;
    this.leaves = [];
  }

  static generatePepper() {
    return Crypto.Random.getBytes(32);
  }

  addLeaf(item: any, data: any) {
    this.leaves.push({
      item: item,
      hash: Crypto.Hashes.sha256AsBinary(data)
    });
  }

  generateTree() {
    this.nLeaves = this.leaves.length;
    this.leaves.sort((a: any, b: any) => Utils.binaryCompare(a.hash, b.hash));

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

  addRawItem(item: any, info: any) {
    const salt = this.getSalt();

    item.salt = Utils.binaryToHexa(salt);
    this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
  }

  addHashableItem(item: any, info: any) {
    const salt = this.getSalt(),
          hash = Crypto.Hashes.sha256AsBinary(item.valueBinary);

    item.hash = Utils.binaryToHexa(hash);
    item.salt = Utils.binaryToHexa(salt);
    this.addLeaf(item, Utils.binaryFrom(salt, info, hash));
  }

  addMaskableItem(item: any, info: any) {
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
  nLeaves: any;
  witnesses: any;
  constructor(nLeaves: any, witnesses: any) {
    super();
    this.nLeaves = nLeaves;
    this.witnesses = (witnesses.match(/.{64}/g) || []).map((s: any) => Utils.binaryFromHexa(s));
  }

  addLeaf(item: any, data: any) {
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

  addRawItem(item: any, info: any) {
    const salt = Utils.binaryFromHexa(item.salt);

    this.addLeaf(item, Utils.binaryFrom(salt, info, item.valueBinary));
  }

  addHashableItem(item: any, info: any) {
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

  addMaskableItem(item: any, info: any) {
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
