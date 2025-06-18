import { Crypto } from "./crypto/crypto.js";
import { Utils } from "./utils/utils.js";
import * as sdk from "@cmts-dev/carmentis-sdk/server";

testSecp256k1();
testMlDsa();
testMlKem();
testSalts();

function testSecp256k1() {
  const secp256k1 = sdk.crypto.secp256k1;

  let ts, time;

  const secretKey = Utils.binaryToHexa(Crypto.Random.getBytes(32));

  const keys = {
    secretKey: secretKey,
    publicKey: secp256k1.publicKeyFromPrivateKey(secretKey)
  };

  const msg = new Uint8Array("As we travel the universe");

  let sig;

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    sig = secp256k1.sign(keys.secretKey, msg);
  }

  time = performance.now() - ts;
  console.log("sign secp256k1", time.toFixed(2), 300 / time * 1000);

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    secp256k1.verify(keys.publicKey, msg, sig);
  }

  time = performance.now() - ts;
  console.log("verify secp256k1", time.toFixed(2), 300 / time * 1000);
}

function testMlDsa() {
  const seed = new Uint8Array([...Array(32)].map((_, i) => i));

  let ts, time;
  let keys;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    keys = Crypto.MLDsa.generateKeyPair(seed);
  }

  time = performance.now() - ts;
  console.log("genKeys mlDsa", time.toFixed(2), 1000 / time * 1000);

  const msg = new Uint8Array("As we travel the universe");

  let sig;

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    sig = Crypto.MLDsa.sign(keys.secretKey, msg);
  }

  time = performance.now() - ts;
  console.log("sign mlDsa", time.toFixed(2), 300 / time * 1000);

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    Crypto.MLDsa.verify(keys.publicKey, msg, sig);
  }

  time = performance.now() - ts;
  console.log("verify mlDsa", time.toFixed(2), 300 / time * 1000);
}

function testMlKem() {
  const seed = new Uint8Array([...Array(64)].map((_, i) => i));

  let ts, time;
  let keys;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    keys = Crypto.MLKem.generateKeyPair(seed);
  }

  console.log(keys);

  time = performance.now() - ts;
  console.log("genKeys mlKem", time.toFixed(2), 1000 / time * 1000);

  let encaps;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    encaps = Crypto.MLKem.encapsulate(keys.publicKey);
  }

  console.log("encaps", encaps);

  time = performance.now() - ts;
  console.log("encapsulate", time.toFixed(2), 1000 / time * 1000);

  let decaps;

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    decaps = Crypto.MLKem.decapsulate(encaps.cipherText, keys.secretKey);
  }

  console.log("decaps", decaps);

  time = performance.now() - ts;
  console.log("decapsulate", time.toFixed(2), 300 / time * 1000);
}

function testSalts() {
  let ts, time, salts;

  ts = performance.now();
  salts = [];

  for(let n = 0; n < 100000; n++) {
    const data = new Uint8Array([...Array(256)].map(() => Math.random() * 256 | 0)),
          hash = Crypto.Hashes.sha256AsBinary(data),
          s0 = hash.slice(0, 128),
          s1 = hash.slice(128);

    salts.push(s0, s1);
  }
  time = performance.now() - ts;
  console.log(time.toFixed(2), salts.length / time * 1000);

  ts = performance.now();
  salts = [];

  for(let n = 0; n < 50000; n++) {
    const data = new Uint8Array([...Array(256)].map(() => Math.random() * 256 | 0)),
          hash = Crypto.Hashes.sha512AsBinary(data),
          s0 = hash.slice(0, 128),
          s1 = hash.slice(128, 256),
          s2 = hash.slice(256, 384),
          s3 = hash.slice(384);

    salts.push(s0, s1, s2, s3);
  }
  time = performance.now() - ts;
  console.log(time.toFixed(2), salts.length / time * 1000);
}
