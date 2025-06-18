import { Random } from "./random.js";
import { Hashes } from "./hashes.js";
import { Aes } from "./aes.js";
import { MLDsa } from "./ml-dsa.js";
import { MLKem } from "./ml-kem.js";
import { Secp256k1 } from "./secp256k1.js";

const SIG_ALGORITHM_IDS = {
  SECP256K1: 0,
  ML_DSA: 1
};

const SIG_ALGORITHMS = [
  { name: "SECP256K1", signatureSectionSize: 65 },
  { name: "ML_DSA", signatureSectionSize: 3311 }
];

const KEM_ALGORITHM_IDS = {
  ML_KEM: 0
};

const KEM_ALGORITHMS = [
  { name: "ML-KEM" }
];

export const Crypto = {
  ...SIG_ALGORITHM_IDS,
  SIG_ALGORITHMS,
  ...KEM_ALGORITHM_IDS,
  KEM_ALGORITHMS,
  Random,
  Hashes,
  Aes,
  MLDsa,
  MLKem,
  Secp256k1
};
