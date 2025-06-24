import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
import {etc, getPublicKey, sign as sigsign, verify as sigver} from "@noble/secp256k1";

etc.hmacSha256Sync = (k, ...m) => hmac(sha256, k, etc.concatBytes(...m));

export const Secp256k1 = {
  publicKeyFromPrivateKey,
  sign,
  verify
};

function publicKeyFromPrivateKey(privateKey) {
  return getPublicKey(privateKey);
}

function sign(privateKey, data) {
  let hash = sha256(data),
      signature = sigsign(hash, privateKey);

  return signature.toCompactRawBytes();
}

function verify(publicKey, data, signature) {
  let hash = sha256(data);

  return sigver(signature, hash, publicKey);
}
