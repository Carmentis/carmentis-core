import {PublicKeyEncryptionAlgorithmId} from "./PublicKeyEncryptionAlgorithmId";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";

export abstract class AbstractPublicKeyEncryptionScheme {
    /**
     * Returns the identifier of the scheme.
     */
    abstract getSchemeId(): PublicKeyEncryptionAlgorithmId;

}

export abstract class AbstractPublicEncryptionKey {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract encrypt( message: Uint8Array ): Uint8Array;
    abstract getRawPublicKey(): Uint8Array;

    encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): string {
        return encoder.encode(this.getRawPublicKey());
    }

    getSchemeId() {
        return this.getScheme().getSchemeId();
    }
}

export abstract class AbstractPrivateDecryptionKey {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract decrypt(ciphertext: Uint8Array): Uint8Array;
    abstract getRawPrivateKey(): Uint8Array;
    abstract getPublicKey(): AbstractPublicEncryptionKey;
    encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): string {
        return encoder.encode(this.getRawPrivateKey());
    }

    /**
     * Returns the supported seed lengths for the scheme.
     * @returns {number[]} An array of supported seed lengths.
     */
    abstract getSupportedSeedLength(): number[];
}

