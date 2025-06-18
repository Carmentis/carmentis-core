import { sha256 } from "@noble/hashes/sha256";
import { hmac } from "@noble/hashes/hmac";
import * as secp256k1 from "@noble/secp256k1";

secp256k1.etc.hmacSha256Sync = (k, ...m) => hmac(sha256, k, secp256k1.etc.concatBytes(...m));

export const Secp256k1 = {
  publicKeyFromPrivateKey,
  sign,
  verify
};

function publicKeyFromPrivateKey(privateKey) {
  return secp256k1.getPublicKey(privateKey);
}

function sign(privateKey, data) {
  let hash = sha256(data),
      signature = secp256k1.sign(hash, privateKey);

  return signature.toCompactRawBytes();
}

function verify(publicKey, data, signature) {
  let hash = sha256(data);

  return secp256k1.verify(signature, hash, publicKey);
}
