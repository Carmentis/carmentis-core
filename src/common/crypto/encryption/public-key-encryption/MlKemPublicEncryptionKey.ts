import {AbstractPublicEncryptionKey, AbstractPublicKeyEncryptionScheme} from "./PublicKeyEncryptionSchemeInterface";
import {EncoderFactory} from "../../../utils/encoder";
import {ml_kem768} from "@noble/post-quantum/ml-kem";
import {AES256GCMSymmetricEncryptionKey} from "../symmetric-encryption/encryption-interface";

import {MlKemPublicKeyEncryptionScheme} from "./MlKemPublicKeyEncryptionScheme";
import {MlKemCiphertextEncoder} from "./MlKemCiphertextEncoder";

export class MlKemPublicEncryptionKey extends AbstractPublicEncryptionKey {
    private static encoder = EncoderFactory.bytesToBase64Encoder();

    constructor(private readonly publicKey: Uint8Array) {
        super();
    }

    encrypt(message: Uint8Array): Uint8Array {
        const {cipherText: encryptedSharedSecret, sharedSecret} = ml_kem768.encapsulate(this.publicKey);
        const cipher = AES256GCMSymmetricEncryptionKey.createFromBytes(sharedSecret);
        const encryptedMessage = cipher.encrypt(message);
        const encoder = new MlKemCiphertextEncoder();
        return encoder.encode(encryptedSharedSecret, encryptedMessage);
    }

    getRawPublicKey(): Uint8Array {
        return this.publicKey;
    }

    getScheme(): AbstractPublicKeyEncryptionScheme {
        return new MlKemPublicKeyEncryptionScheme();
    }
}
