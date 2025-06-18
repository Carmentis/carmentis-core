import { Utils } from "../utils/utils.js";
import { randomBytes } from "@noble/hashes/utils";

export const Random = {
  getBytes,
  getInteger,
  getKey256
};

function getBytes(n) {
  return randomBytes(n);
}

function getInteger(max) {
  const rand = getBytes(6);
  let v = 0;

  for(let i = 0; i < 6; i++) {
    v = v * 256 + rand[i];
  }

  return Math.floor(v / 2 ** 48 * max);
}

function getKey256() {
  const key = getBytes(32);

  return Utils.binaryToHexa(key);
}
