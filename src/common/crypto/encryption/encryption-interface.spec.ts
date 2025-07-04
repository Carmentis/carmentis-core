import {
    AES256GCMSymmetricEncryptionKey,
    ExtendedSymmetricEncryptionKey,
    SymmetricEncryptionAlgorithmId,
    SymmetricEncryptionKey
} from './encryption-interface';

describe('ExtendedSymmetricEncryptionKey', () => {
    let mockWrappedKey: SymmetricEncryptionKey;

    beforeEach(() => {
        mockWrappedKey = {
            getSymmetricEncryptionSchemeId: jest.fn(() => SymmetricEncryptionAlgorithmId.AES_256_GCM),
            encrypt: jest.fn((plaintext: Uint8Array) => new Uint8Array([...plaintext, 1])),
            decrypt: jest.fn((ciphertext: Uint8Array) => new Uint8Array(ciphertext.slice(0, -1))),
            getRawSecretKey: jest.fn(() => new Uint8Array(32).fill(8))
        };
    });

    it('should encrypt plaintext string and return Base64-encoded ciphertext', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        const plaintext = 'test string';
        const ciphertext = key.encryptString(plaintext);

        expect(ciphertext).toBe(Buffer.from(mockWrappedKey.encrypt(new TextEncoder().encode(plaintext))).toString('base64'));
    });

    it('should decrypt Base64-encoded ciphertext back to plaintext string', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        const plaintext = 'test string';
        const ciphertext = Buffer.from(mockWrappedKey.encrypt(new TextEncoder().encode(plaintext))).toString('base64');
        const decrypted = key.decryptString(ciphertext);

        expect(decrypted).toBe(plaintext);
    });

    it('should return the wrapped key\'s encryption algorithm ID', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        expect(key.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionAlgorithmId.AES_256_GCM);
    });

    it('should correctly encrypt data using the wrapped key', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        const plaintext = new Uint8Array([1, 2, 3]);
        const ciphertext = key.encrypt(plaintext);

        expect(ciphertext).toEqual(new Uint8Array([...plaintext, 1]));
        expect(mockWrappedKey.encrypt).toHaveBeenCalledWith(plaintext);
    });

    it('should correctly decrypt data using the wrapped key', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        const ciphertext = new Uint8Array([1, 2, 3, 1]);
        const plaintext = key.decrypt(ciphertext);

        expect(plaintext).toEqual(new Uint8Array([1, 2, 3]));
        expect(mockWrappedKey.decrypt).toHaveBeenCalledWith(ciphertext);
    });

    it('should retrieve the raw secret key from the wrapped key', () => {
        const key = new ExtendedSymmetricEncryptionKey(mockWrappedKey);
        const rawKey = key.getRawSecretKey();

        expect(rawKey).toEqual(new Uint8Array(32).fill(8));
        expect(mockWrappedKey.getRawSecretKey).toHaveBeenCalled();
    });
});
describe('AES256GCMSymmetricEncryptionKey', () => {
    it('should generate a valid key', () => {
        const keyInstance = AES256GCMSymmetricEncryptionKey.generate();
        expect(keyInstance).toBeInstanceOf(AES256GCMSymmetricEncryptionKey);
        expect(keyInstance.getRawSecretKey()).toBeInstanceOf(Uint8Array);
        expect(keyInstance.getRawSecretKey().length).toBe(32);
    });

    it('should create a key from bytes', () => {
        const keyBytes = new Uint8Array(32);
        crypto.getRandomValues(keyBytes);
        const keyInstance = AES256GCMSymmetricEncryptionKey.createFromBytes(keyBytes);
        expect(keyInstance).toBeInstanceOf(AES256GCMSymmetricEncryptionKey);
        expect(keyInstance.getRawSecretKey()).toEqual(keyBytes);
    });

    it('should return the correct encryption algorithm ID', () => {
        const keyBytes = new Uint8Array(32);
        crypto.getRandomValues(keyBytes);
        const keyInstance = AES256GCMSymmetricEncryptionKey.createFromBytes(keyBytes);
        expect(keyInstance.getSymmetricEncryptionSchemeId()).toBe(SymmetricEncryptionAlgorithmId.AES_256_GCM);
    });

    it('should encrypt and decrypt data correctly', () => {
        const keyInstance = AES256GCMSymmetricEncryptionKey.generate();
        const plaintext = new Uint8Array([1, 2, 3, 4, 5]);

        const ciphertext = keyInstance.encrypt(plaintext);
        expect(ciphertext.length).toBeGreaterThan(plaintext.length);

        const decrypted = keyInstance.decrypt(ciphertext);
        expect(decrypted).toEqual(plaintext);
    });

    it('should fail decryption with tampered data', () => {
        const keyInstance = AES256GCMSymmetricEncryptionKey.generate();
        const plaintext = new Uint8Array([10, 20, 30, 40]);

        const ciphertext = keyInstance.encrypt(plaintext);
        ciphertext[0] = ciphertext[0] ^ 255; // Tamper the first byte of the ciphertext.

        expect(() => keyInstance.decrypt(ciphertext)).toThrow(); // Expect decryption to fail.
    });
});