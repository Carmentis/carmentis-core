import {sha512} from "@noble/hashes/sha2";

export * from "../common/common";
import {hashes} from "@noble/ed25519";
hashes.sha512 = sha512;
export { wiServer } from "./walletInterface/wiServer";