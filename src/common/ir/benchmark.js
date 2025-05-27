import * as sdk from "@cmts-dev/carmentis-sdk/server";

testSecp256k1();
testMlDsa();
testMlKem();
testSalts();

function testSecp256k1() {
  const secp256k1 = sdk.crypto.secp256k1;

  let ts, time;

  const secretKey = sdk.utils.encoding.toHexa(sdk.crypto.getRandomBytes(32));

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
  console.log("sign", time.toFixed(2), 300 / time * 1000);

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    secp256k1.verify(keys.publicKey, msg, sig);
  }

  time = performance.now() - ts;
  console.log("verify", time.toFixed(2), 300 / time * 1000);
}

function testMlDsa() {
  const mlDsa = sdk.crypto.mlDsa;
  const seed = new Uint8Array([...Array(32)].map((_, i) => i));

  let ts, time;
  let keys;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    keys = mlDsa.generateKeyPair(seed);
  }

  time = performance.now() - ts;
  console.log("genKeys", time.toFixed(2), 1000 / time * 1000);

  const msg = new Uint8Array("As we travel the universe");

  let sig;

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    sig = mlDsa.sign(keys.secretKey, msg);
  }

  time = performance.now() - ts;
  console.log("sign", time.toFixed(2), 300 / time * 1000);

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    mlDsa.verify(keys.publicKey, msg, sig);
  }

  time = performance.now() - ts;
  console.log("verify", time.toFixed(2), 300 / time * 1000);
}

function testMlKem() {
  const mlKem = sdk.crypto.mlKem;
  const seed = new Uint8Array([...Array(64)].map((_, i) => i));

  let ts, time;
  let keys;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    keys = mlKem.generateKeyPair(seed);
  }

  time = performance.now() - ts;
  console.log("genKeys", time.toFixed(2), 1000 / time * 1000);

  let encaps;

  ts = performance.now();

  for(let n = 0; n < 1000; n++) {
    encaps = mlKem.encapsulate(keys.publicKey);
  }

  time = performance.now() - ts;
  console.log("encapsulate", time.toFixed(2), 1000 / time * 1000);

  ts = performance.now();

  for(let n = 0; n < 300; n++) {
    mlKem.decapsulate(encaps.cipherText, keys.secretKey);
  }

  time = performance.now() - ts;
  console.log("decapsulate", time.toFixed(2), 300 / time * 1000);
}

function testSalts() {
  let ts, time, salts;

  ts = performance.now();
  salts = [];

  for(let n = 0; n < 100000; n++) {
    const data = new Uint8Array([...Array(256)].map(_ => Math.random() * 256 | 0)),
          hash = sdk.crypto.sha256AsBinary(data),
          s0 = hash.slice(0, 128),
          s1 = hash.slice(128);

    salts.push(s0, s1);
  }
  time = performance.now() - ts;
  console.log(time.toFixed(2), salts.length / time * 1000);

  ts = performance.now();
  salts = [];

  for(let n = 0; n < 50000; n++) {
    const data = new Uint8Array([...Array(256)].map(_ => Math.random() * 256 | 0)),
          hash = sdk.crypto.sha512AsBinary(data),
          s0 = hash.slice(0, 128),
          s1 = hash.slice(128, 256),
          s2 = hash.slice(256, 384),
          s3 = hash.slice(384);

    salts.push(s0, s1, s2, s3);
  }
  time = performance.now() - ts;
  console.log(time.toFixed(2), salts.length / time * 1000);
}
