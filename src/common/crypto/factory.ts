import {
    AES256GCMSymmetricEncryptionKey,
    DecapsulationKey,
    EncapsulationKey,
    InsecureKeyExchangeScheme,
    KeyExchangeAlgorithmId,
    SymmetricEncryptionAlgorithmId,
    SymmetricEncryptionKey,
} from "./encryption/encryption-interface";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId,} from "./signature/signature-interface";
import {MLDSA65PrivateSignatureKey} from "./signature/ml-dsa-65";
import {BytesSignatureEncoder} from "./signature/signature-encoder";
import {CryptographicHash, CryptographicHashAlgorithmId, Sha256CryptographicHash} from "./hash/hash-interface";

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
        const encoder = new BytesSignatureEncoder();
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return encoder.decodePublicKey(publicKey);
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

    static createCryptographicHash(schemeId: CryptographicHashAlgorithmId): CryptographicHash {
        switch (schemeId) {
            case CryptographicHashAlgorithmId.SHA256: return new Sha256CryptographicHash();
            default: throw `Not supported hash scheme ID: ${schemeId}`
        }
    }


    static createDefaultCryptographicHash(): CryptographicHash {
        return new Sha256CryptographicHash()
    }
}