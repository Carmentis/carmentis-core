import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";

import {Utils} from "../utils/utils";
import {ActorCrypto} from "./ActorCrypto";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {ActorSeedEncoder} from "../utils/ActorSeedEncoder";
import {AccountSeedEncoder} from "../utils/AccountSeedEncoder";
import {SeedEncoder} from "../utils/SeedEncoder";
import {EncoderInterface} from "../utils/encoder";
import {BinaryToStringEncoderInterface} from "../utils/BinaryToStringEncoderInterface";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";

/**
 * Represents the cryptographic operations handled by an account.
 * An account is derived from a wallet ('s seed) and a nonce unique for each account.
 */
export class AccountCrypto {

    static createFromWalletSeedAndNonce(walletSeed: Uint8Array, accountNonce: number) {
        const inputSeed = Utils.binaryFrom(walletSeed, accountNonce);
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const info = this.encoderStringAsBytes("ACCOUNT_SEED");
        const accountSeed = kdf.deriveKeyNoSalt(
            inputSeed,
            info,
            32
        );
        return new AccountCrypto(accountSeed);
    }

    static parseFromString(seed: string, encoder: BinaryToStringEncoderInterface = new AccountSeedEncoder()): AccountCrypto {
        return new AccountCrypto(encoder.decode(seed));
    }

    encode( encoder: BinaryToStringEncoderInterface = new AccountSeedEncoder()): string {
        return encoder.encode(this.accountSeed);
    }

    constructor(private readonly accountSeed: Uint8Array) {}

    deriveActorFromVbSeed(vbSeed: Uint8Array) {
        return ActorCrypto.createFromAccountSeedAndVbSeed(this.accountSeed, vbSeed);
    }

    getPrivateSignatureKey(schemeId: SignatureSchemeId) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const scheme = CryptoSchemeFactory.createSignatureScheme(schemeId);
        const info = AccountCrypto.encoderStringAsBytes(`SIG_${schemeId}`);
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
        const info = AccountCrypto.encoderStringAsBytes(`PKE_${schemeId}`);
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

    static encoderStringAsBytes(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }

    getAccountSeed() {
        return this.accountSeed;
    }

    private static concatWalletSeedWith(walletSeed: Uint8Array, data: Uint8Array) {
        return new Uint8Array([...walletSeed, ...data])
    }

    private static numberToUint8Array(num: number, byteLength: number = 4): Uint8Array {
        const buffer = new ArrayBuffer(byteLength);
        const view = new DataView(buffer);

        if (byteLength === 1) {
            view.setUint8(0, num);
        } else if (byteLength === 2) {
            view.setUint16(0, num, false); // false = big endian
        } else if (byteLength === 4) {
            view.setUint32(0, num, false); // false = big endian
        } else if (byteLength === 8) {
            view.setBigUint64(0, BigInt(num), false); // false = big endian
        }

        return new Uint8Array(buffer);
    }
}