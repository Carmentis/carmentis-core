import {sha256} from "@noble/hashes/sha2";

export interface CryptographicHash {
    getHashSchemeId(): CryptographicHashSchemeId;
    hash(data: Uint8Array): Uint8Array;
}

export enum CryptographicHashSchemeId {
    SHA256,
}

export class Sha256CryptographicHash implements CryptographicHash {
    getHashSchemeId(): CryptographicHashSchemeId {
        return CryptographicHashSchemeId.SHA256;
    }

    hash(data: Uint8Array): Uint8Array {
        return sha256(data);
    }
}