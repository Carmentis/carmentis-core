import {
    KeyExchangeAlgorithmId,
    DecapsulationKey,
    InsecureKeyExchangeScheme,
    EncapsulationKey,
    SymmetricEncryptionKey,
    SymmetricEncryptionAlgorithmId, AES256GCMSymmetricEncryptionKey,
} from "./encryption/encryption-interface";
import {
    PrivateSignatureKey, PublicSignatureKey,
    SignatureAlgorithmId,
    SignatureScheme
} from "./signature-interface";
import {hexToBytes} from "@noble/ciphers/utils";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicKeyEncoder} from "./signature/ml-dsa-65";

export class CryptoSchemeFactory {


    createPrivateSignatureKey( schemeId: number, walletSeed: Uint8Array ): PrivateSignatureKey {
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(walletSeed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    createVirtualBlockchainPrivateSignatureScheme( schemeId: number, walletSeed: Uint8Array , vbSeed: Uint8Array ): PrivateSignatureKey {
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(walletSeed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }


    createDecapsulationKey( schemeId: number, walletSeed: Uint8Array  ): DecapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }

    createVirtualBlockchainDecapsulationKey( schemeId: number, walletSeed: Uint8Array, vbSeed: Uint8Array ): DecapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }



    createPublicSignatureKey( schemeId: number, publicKey: Uint8Array ): PublicSignatureKey {
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PublicKeyEncoder().decodeFromUint8Array(publicKey);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    createEncapsulationKey( schemeId: number, encapsulationKey: Uint8Array  ): EncapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }

    /**
     * Creates a symmetric encryption key based on the provided encryption scheme ID and raw key data.
     *
     * @param {number} symmetricEncryptionSchemeId - The ID of the symmetric encryption scheme to use.
     * @param {Uint8Array<ArrayBufferLike>} rawKey - The raw key data used to create the symmetric encryption key.
     * @return {SymmetricEncryptionKey} The generated symmetric encryption key.
     */
    createSymmetricEncryptionKey(symmetricEncryptionSchemeId: number, rawKey: Uint8Array<ArrayBufferLike>): SymmetricEncryptionKey {
        switch (symmetricEncryptionSchemeId) {
            case SymmetricEncryptionAlgorithmId.AES_256_GCM: return AES256GCMSymmetricEncryptionKey.createFromBytes(rawKey);
            default: throw `Not supported encryption scheme ID: ${symmetricEncryptionSchemeId}`
        }
    }
}