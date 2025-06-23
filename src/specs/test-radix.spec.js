import { describe, expect, test } from "@jest/globals";
import { NODE_SCHEMAS } from "../common/dev-node/constants/constants.js";
import { LevelDb } from "../common/dev-node/levelDb.js";
import { RadixTree } from "../common/trees/radixTree.js";
import { Crypto } from "../common/crypto/crypto.js";
import { Utils } from "../common/utils/utils.js";

describe('testRadix', () => {
  test('radix set/get test', async () => {
    const db = new LevelDb(".database-test", NODE_SCHEMAS.DB);
    await db.initialize();
    await db.clear();

    const vbRadix = new RadixTree(db, NODE_SCHEMAS.DB_VB_RADIX);

    const keys = [], values = [];
    const N = 100;

    for(let n = 0; n < N; n++) {
      keys[n] = Crypto.Random.getBytes(32);
      values[n] = Crypto.Random.getBytes(32);
      await vbRadix.set(keys[n], values[n]);
    }
    await vbRadix.flush();

    const rootHash = await vbRadix.getRootHash();

    for(let n = 0; n < N; n++) {
      const res = await vbRadix.get(keys[n]);

      if(!Utils.binaryIsEqual(res.value, values[n])) {
        throw `read value is invalid`;
      }

      const proofRootHash = await RadixTree.verifyProof(keys[n], res.value, res.proof);

      if(!Utils.binaryIsEqual(proofRootHash, rootHash)) {
        throw `failed proof`;
      }
    }
  });
});
