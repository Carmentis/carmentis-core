import {PasswordBasedKeyDerivationFunctionAlgorithmId} from "./PasswordBasedKeyDerivationFunctionAlgorithmId";

export abstract class PasswordBasedKeyDerivationFunction {
    abstract getKeyDerivationFunctionAlgorithmId(): PasswordBasedKeyDerivationFunctionAlgorithmId;
    abstract deriveKey(password: string, salt: string, keyLength: number): Uint8Array;
    deriveKeyNoSalt(password: string, keyLength: number): Uint8Array {
        const emptySalt = '';
        return this.deriveKey(password, emptySalt, keyLength);
    }
}