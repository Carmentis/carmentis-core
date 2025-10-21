import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {randomBytes} from "@noble/post-quantum/utils";
import {PrivateSignatureKey, SignatureSchemeId} from "../crypto/signature/signature-interface";
import {HKDF} from "../crypto/kdf/HKDF";

/**
 * The Wallet class is responsible for generating and managing cryptographic keys
 * based on a provided wallet seed. It provides methods to retrieve private signature
 * keys, decapsulation keys, and keys specific to virtual blockchains.
 */
export class Wallet {
    private constructor( private walletSeed: Uint8Array ) {}

    /**
     * Generates a new Wallet instance using a randomly generated seed.
     *
     * @return {Wallet} A new Wallet object created with a random seed.
     */
    static generateWallet(): Wallet {
        const seed = randomBytes(64);
        return new Wallet(seed);
    }

    static fromSeed(seed: Uint8Array): Wallet {
        return new Wallet(seed);
    }





    /**
     * Retrieves the decapsulation key for a given cryptographic scheme ID.
     *
     * @param {number} schemeId - The identifier of the cryptographic scheme for which the decapsulation key is needed.
     * @return {*} The generated decapsulation key for the specified scheme ID.
     */
    getDecapsulationKey( schemeId: number ) {
        const factory = new CryptoSchemeFactory();
        return factory.createDecapsulationKey( schemeId, this.walletSeed );
    }




    getAccountPrivateSignatureKey( schemeId: SignatureSchemeId,  nonce: number ) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const inputKeyMaterial = this.concatWalletSeedWith(this.numberToUint8Array(nonce));
        const info = this.encoderStringAsBytes("WALLET_ACCOUNT_PRIVATE_SIGNATURE_KEY");
        const seed = kdf.deriveKeyNoSalt(
            inputKeyMaterial,
            info,
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }

    getActorPrivateSignatureKey(schemeId: number, vbSeed: Uint8Array, nonce: number) {
        const kdf = CryptoSchemeFactory.createDefaultKDF();
        const inputKeyMaterial = this.concatWalletSeedWith(this.numberToUint8Array(nonce));
        const info = this.encoderStringAsBytes("WALLET_ACCOUNT_PRIVATE_SIGNATURE_KEY");
        const seed = kdf.deriveKeyNoSalt(
            inputKeyMaterial,
            info,
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, seed );
    }



    /**
     * Retrieves the virtual blockchain decapsulation key using the specified scheme ID and virtual blockchain seed.
     *
     * @param {number} schemeId - The identifier of the cryptographic scheme to be used for generating the key.
     * @param {Uint8Array} vbSeed - The virtual blockchain seed
     * */
    getVirtualBlockchainDecapsulationKey( schemeId: number, vbSeed: Uint8Array ) {
        const factory = new CryptoSchemeFactory();
        return factory.createVirtualBlockchainDecapsulationKey( schemeId, this.walletSeed, vbSeed );
    }

    private concatWalletSeedWith(data: Uint8Array) {
        return new Uint8Array([...this.walletSeed, ...data])
    }

    private encoderStringAsBytes(data: string): Uint8Array {
        const encoder = new TextEncoder();
        return encoder.encode(data);
    }

    private numberToUint8Array(num: number, byteLength: number = 4): Uint8Array {
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