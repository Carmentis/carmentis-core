import {PublicKeyEncryptionSchemeId} from "./PublicKeyEncryptionSchemeId";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";

export abstract class AbstractPublicKeyEncryptionScheme {
    /**
     * Returns the identifier of the scheme.
     */
    abstract getSchemeId(): PublicKeyEncryptionSchemeId;

}

export abstract class AbstractPublicEncryptionKey {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract encrypt( message: Uint8Array ): Promise<Uint8Array>;
    abstract getRawPublicKey(): Promise<Uint8Array>;

    async encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): Promise<string> {
        return encoder.encode(await this.getRawPublicKey());
    }

    getSchemeId() {
        return this.getScheme().getSchemeId();
    }
}

export abstract class AbstractPrivateDecryptionKey  {
    abstract getScheme(): AbstractPublicKeyEncryptionScheme;
    abstract decrypt(ciphertext: Uint8Array): Promise<Uint8Array>;
    abstract getRawPrivateKey(): Uint8Array;
    abstract getPublicKey(): Promise<AbstractPublicEncryptionKey>;
    encode(encoder: EncoderInterface<Uint8Array, string> = EncoderFactory.defaultBytesToStringEncoder()): string {
        return encoder.encode(this.getRawPrivateKey());
    }

    /**
     * Returns the supported seed lengths for the scheme.
     * @returns {number[]} An array of supported seed lengths.
     */
    abstract getSupportedSeedLength(): number[];
}
