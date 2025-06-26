export enum PasswordBasedKeyDerivationFunctionAlgorithmId {
    PBKDF2,
}

export enum KeyDerivationFunctionAlgorithmId {
    HKDF
}

export interface KeyDerivationFunction {
    getKeyDerivationFunctionAlgorithmId(): KeyDerivationFunctionAlgorithmId;

    deriveKey(inputKeyingMaterial: Uint8Array, salt: string, info: string, keyLength: number): Uint8Array;
}

export interface PasswordBasedKeyDerivationFunction {
    getKeyDerivationFunctionAlgorithmId(): PasswordBasedKeyDerivationFunctionAlgorithmId;
    deriveKey(inputKeyingMaterial: string, salt: string, info: string, keyLength: number): Uint8Array;
}


import {pbkdf2} from '@noble/hashes/pbkdf2';
import {sha256} from '@noble/hashes/sha2';
import {hkdf} from '@noble/hashes/hkdf';

export class HKDF implements KeyDerivationFunction {
    getKeyDerivationFunctionAlgorithmId(): KeyDerivationFunctionAlgorithmId {
        return KeyDerivationFunctionAlgorithmId.HKDF;
    }

    deriveKey(inputKeyingMaterial: Uint8Array, salt: string, info: string, keyLength: number): Uint8Array {
        return hkdf(sha256, inputKeyingMaterial, salt, info, keyLength);
    }
}

export class PBKDF2 implements PasswordBasedKeyDerivationFunction {
    getKeyDerivationFunctionAlgorithmId(): PasswordBasedKeyDerivationFunctionAlgorithmId {
        return PasswordBasedKeyDerivationFunctionAlgorithmId.PBKDF2;
    }

    deriveKey(inputKeyingMaterial: string, salt: string, info: string, keyLength: number): Uint8Array {
        return pbkdf2(sha256, inputKeyingMaterial, salt, {c: 100000, dkLen: keyLength});
    }
}

