import { sha256 } from "@noble/hashes/sha2";

export interface CryptographicHash {
    getHashSchemeId(): CryptographicHashAlgorithmId;
    hash(data: Uint8Array): Uint8Array;
}

export enum CryptographicHashAlgorithmId {
    SHA256,
}

export class Sha256CryptographicHash implements CryptographicHash {
    getHashSchemeId(): CryptographicHashAlgorithmId {
        return CryptographicHashAlgorithmId.SHA256;
    }

    hash(data: Uint8Array): Uint8Array {
        return sha256(data);
    }
}