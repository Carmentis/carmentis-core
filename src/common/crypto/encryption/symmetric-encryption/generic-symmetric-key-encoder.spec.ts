// generic-symmetric-key-encoder.spec.ts
import {GenericSymmetricKeyEncoder} from './generic-symmetric-key-encoder';
import {
    AES256GCMSymmetricEncryptionKey,
    SymmetricEncryptionAlgorithmId,
    SymmetricEncryptionKey
} from "./encryption-interface";

describe('GenericSymmetricKeyEncoder', () => {
    let encoder: GenericSymmetricKeyEncoder;

    beforeEach(() => {
        encoder = new GenericSymmetricKeyEncoder();
    });

    describe('AES-256-CGM correct encoding', () => {
        it('should correctly encode a symmetric encryption key into Uint8Array', () => {
            const key = AES256GCMSymmetricEncryptionKey.generate();
            const encodedKey = encoder.encodeAsUint8Array(key);
            const decodedKey = encoder.decodeFromUint8Array(encodedKey);
            expect(key.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionAlgorithmId.AES_256_GCM);
            expect(decodedKey.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionAlgorithmId.AES_256_GCM);
            expect(key.getRawSecretKey()).toEqual(decodedKey.getRawSecretKey());
        });
    });
});