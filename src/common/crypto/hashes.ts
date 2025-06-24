import { Utils } from "../utils/utils.js";
import { sha256 as H256 } from "@noble/hashes/sha256";
import { sha512 as H512 } from "@noble/hashes/sha512";

export const Hashes = {
  sha256AsBinary,
  sha256,
  sha512AsBinary,
  sha512
};

function sha256AsBinary(data) {
  if(!(data instanceof Uint8Array)) {
    throw "Argument passed to compute sha256 is not an instance of Uint8Array";
  }
  return H256(data);
}

function sha256(data) {
  return Utils.binaryToHexa(sha256AsBinary(data));
}

function sha512AsBinary(data) {
  if(!(data instanceof Uint8Array)) {
    throw "Argument passed to compute sha512 is not an instance of Uint8Array";
  }
  return H512(data);
}

function sha512(data) {
  return Utils.binaryToHexa(sha512AsBinary(data));
}
