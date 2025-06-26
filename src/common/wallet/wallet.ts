import {CryptoSchemeFactory} from "../crypto/factory";
import {randomBytes} from "@noble/post-quantum/utils";
import {HKDF} from "../crypto/kdf/kdf-interface";
import {PrivateSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";

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
     * Derives a private signature key based on the provided signature algorithm ID and nonce.
     *
     * @param {SignatureAlgorithmId} schemeId - The ID of the signature algorithm to be used for key creation.
     * @param {number} nonce - A numeric value used to ensure uniqueness in the key derivation process.
     * @return {PrivateSignatureKey} The derived private signature key for the specified scheme and nonce.
     */
    getPrivateSignatureKey( schemeId: SignatureAlgorithmId, nonce: number ): PrivateSignatureKey {
        const kdf = new HKDF();
        const accountSeed = kdf.deriveKey(
            this.walletSeed,
            nonce.toString(),
            String(32),
            32
        );
        return CryptoSchemeFactory.createPrivateSignatureKey( schemeId, accountSeed );
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

    /**
     * Retrieves the virtual blockchain signature key corresponding to a specific scheme ID and virtual blockchain seed.
     *
     * @param {number} schemeId - The identifier of the cryptographic scheme to be used.
     * @param {Uint8Array} vbSeed - The seed value specific to the virtual
     * */
    getVirtualBlockchainSignatureKey( schemeId: number, vbSeed: Uint8Array ) {
        const factory = new CryptoSchemeFactory();
        return factory.createVirtualBlockchainPrivateSignatureScheme( schemeId, this.walletSeed, vbSeed );
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
}