import {AbstractPublicEncryptionKey, AbstractPublicKeyEncryptionScheme} from "./PublicKeyEncryptionSchemeInterface";
import {EncoderFactory} from "../../../utils/encoder";
import {ml_kem768} from "@noble/post-quantum/ml-kem";
import {AES256GCMSymmetricEncryptionKey} from "../encryption-interface";

import {MlKemPublicKeyEncryptionScheme} from "./MlKemPublicKeyEncryptionScheme";

export class MlKemPublicEncryptionKey extends AbstractPublicEncryptionKey {

    private static encoder = EncoderFactory.bytesToBase64Encoder();

    constructor(private readonly publicKey: Uint8Array) {
        super();
    }

    encrypt(message: Uint8Array): Uint8Array {
        const {cipherText: encryptedSharedSecret, sharedSecret} = ml_kem768.encapsulate(this.publicKey);
        const cipher = AES256GCMSymmetricEncryptionKey.createFromBytes(sharedSecret);
        const encryptedMessage = cipher.encrypt(message);
        const encodedCiphertext = JSON.stringify({
            encryptedSharedSecret,
            encryptedMessage
        });
        return MlKemPublicEncryptionKey.encoder.decode(encodedCiphertext);
    }

    getRawPublicKey(): Uint8Array {
        return this.publicKey;
    }

    getScheme(): AbstractPublicKeyEncryptionScheme {
        return new MlKemPublicKeyEncryptionScheme();
    }
}