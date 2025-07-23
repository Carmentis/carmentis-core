import { hkdf } from '@noble/hashes/hkdf.js';
import { sha256 } from '@noble/hashes/sha2.js';

import {KeyDerivationFunction} from "./KeyDerivationFunction";
import {KeyDerivationFunctionAlgorithmId} from "./keyDerivationFunctionAlgorithmId";

export class HKDF extends KeyDerivationFunction {
    getKeyDerivationFunctionAlgorithmId(): KeyDerivationFunctionAlgorithmId {
        return KeyDerivationFunctionAlgorithmId.HKDF;
    }

    deriveKey(inputKeyingMaterial: Uint8Array, salt: Uint8Array, info: Uint8Array, keyLength: number): Uint8Array {
        return hkdf(sha256, inputKeyingMaterial, salt, info, keyLength);
    }
}