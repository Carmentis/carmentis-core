import {AbstractPrivateDecryptionKey} from "./PublicKeyEncryptionSchemeInterface";
import {EncoderFactory} from "../../../utils/encoder";
import {ml_kem768} from "@noble/post-quantum/ml-kem";
import {randomBytes} from "@noble/post-quantum/utils";
import {AES256GCMSymmetricEncryptionKey} from "../encryption-interface";
import {MlKemPublicEncryptionKey} from "./MlKemPublicEncryptionKey";
import {MlKemPublicKeyEncryptionScheme} from "./MlKemPublicKeyEncryptionScheme";

export class MlKemPrivateDecryptionKey extends AbstractPrivateDecryptionKey {

    /**
     * Generates a private decryption key from a seed.
     * @param seed
     */
    static genFromSeed(seed: Uint8Array) {
        // ensure that length of the seed is 32 bytes
        if (seed.length !== 32) {
            throw new Error("Seed must be 32 bytes long");
        }
        return new MlKemPrivateDecryptionKey(seed);
    }

    /**
     * Generates a random private decryption key.
     */
    static gen() {
        const random = randomBytes(32);
        return new MlKemPrivateDecryptionKey(random);
    }

    private static encoder = EncoderFactory.bytesToBase64Encoder();
    private readonly privateKey: Uint8Array;
    private readonly publicKey: Uint8Array;

    private constructor(private readonly seed: Uint8Array) {
        super()
        const {secretKey, publicKey} = ml_kem768.keygen(seed);
        this.privateKey = secretKey;
        this.publicKey = publicKey;
    }


    getSupportedSeedLength(): number[] {
        return [32]
    }



    getScheme(): MlKemPublicKeyEncryptionScheme {
        return new MlKemPublicKeyEncryptionScheme();
    }

    getPublicKey(): MlKemPublicEncryptionKey {
        return new MlKemPublicEncryptionKey(this.publicKey);
    }

    getRawPrivateKey(): Uint8Array {
        return this.privateKey;
    }

    decrypt(ciphertext: Uint8Array): Uint8Array {
        const {
            encryptedMessage,
            encryptedSharedSecret
        } = JSON.parse(MlKemPrivateDecryptionKey.encoder.encode(ciphertext));
        const sharedSecret = ml_kem768.decapsulate(encryptedSharedSecret, this.privateKey);
        const cipher = AES256GCMSymmetricEncryptionKey.createFromBytes(sharedSecret);
        const plaintext = cipher.decrypt(encryptedMessage);
        return plaintext;
    }
}