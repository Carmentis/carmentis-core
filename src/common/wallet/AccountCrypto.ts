import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";

import {Utils} from "../utils/utils";
import {ActorCrypto} from "./ActorCrypto";
import {SignatureSchemeId} from "../crypto/signature/signature-interface";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";

/**
 * Represents the cryptographic operations handled by an account.
 * An account is derived from a wallet ('s seed) and a nonce unique for each account.
 */
export class AccountCrypto {

    static createFromWalletSeedAndNonce(walletSeed: Uint8Array, accountNonce: number) {
        const accountSeed = Utils.binaryFrom(walletSeed, accountNonce);
        return new AccountCrypto(accountSeed);
    }

    constructor(private readonly accountSeed: Uint8Array) {}

    deriveActorFromVbSeed(vbSeed: Uint8Array) {
        return ActorCrypto.createFromAccountSeedAndVbSeed(this.accountSeed, vbSeed);
    }

    getPrivateSignatureKey(schemeId: SignatureSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("WALLET_ACCOUNT_PRIVATE_SIGNATURE_KEY");
        const seed = kdf.deriveKeyNoSalt(
            this.accountSeed,
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
            this.accountSeed,
            info,
            32
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

    getAccountSeed() {
        return this.accountSeed;
    }
}