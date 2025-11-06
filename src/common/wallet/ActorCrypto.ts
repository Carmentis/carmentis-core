import {Utils} from "../utils/utils";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {WalletSeedEncoder} from "../utils/WalletSeedEncoder";
import {ActorSeedEncoder} from "../utils/ActorSeedEncoder";
import {BinaryToStringEncoderInterface} from "../utils/BinaryToStringEncoderInterface";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";

export class ActorCrypto {
    constructor(private readonly actorSeed: Uint8Array) {}

    static createFromAccountSeedAndVbSeed(accountSeed: Uint8Array, vbSeed: Uint8Array) {
        const actorSeed = Utils.binaryFrom(accountSeed, vbSeed);
        return new ActorCrypto(actorSeed);
    }

    static parseFromString(seed: string,  encoder: BinaryToStringEncoderInterface = new ActorSeedEncoder()): ActorCrypto {
        return new ActorCrypto(encoder.decode(seed));
    }

    encode( encoder: BinaryToStringEncoderInterface = new ActorSeedEncoder()): string {
        return encoder.encode(this.actorSeed);
    }

    getPrivateSignatureKey(schemeId: SignatureSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("SIG");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }

    getPublicSignatureKey(schemeId: SignatureSchemeId) {
        const privateKey = this.getPrivateSignatureKey(schemeId);
        return privateKey.getPublicKey();
    }

    getPrivateDecryptionKey(schemeId: PublicKeyEncryptionSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("PKE");
        const seed = kdf.deriveKeyNoSalt(
            this.actorSeed,
            info,
            64
        );
        return CryptoSchemeFactory.createPrivateDecryptionKey( schemeId, seed );
    }

    getPublicEncryptionKey(schemeId: PublicKeyEncryptionSchemeId) {
        const privateDecryptionKey = this.getPrivateDecryptionKey(schemeId);
        return privateDecryptionKey.getPublicKey();
    }

    private encoderStringAsBytes(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }
}