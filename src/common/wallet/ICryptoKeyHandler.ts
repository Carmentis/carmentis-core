import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {
    PrivateDecryptionKey,
    PublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";

export interface ICryptoKeyHandler {
    getPrivateSignatureKey(schemeId: SignatureSchemeId): PrivateSignatureKey;
    getPublicSignatureKey(schemeId: SignatureSchemeId): PublicSignatureKey;
    getPrivateDecryptionKey(schemeId: PublicKeyEncryptionSchemeId): PrivateDecryptionKey;
    getPublicEncryptionKey(schemeId: PublicKeyEncryptionSchemeId): PublicEncryptionKey;
    getSeedAsBytes(): Uint8Array;
}