import {getPublicKey, PrivKey, sign, utils, etc, verify} from '@noble/secp256k1';
import {sha256} from "@noble/hashes/sha2";
import {EncoderInterface} from "../../utils/encoder";
import {PublicSignatureKey} from "./PublicSignatureKey";
import {SignatureScheme} from "./SignatureScheme";
import {PrivateSignatureKey} from "./PrivateSignatureKey";
import {BasePrivateSignatureKey} from "./BasePrivateSignatureKey";
import {BasePublicSignatureKey} from "./BasePublicSignatureKey";
import {SignatureSchemeId} from "./SignatureSchemeId";

/**
 * The `Secp256k1SignatureScheme` class implements the `SignatureScheme` interface and provides
 * functionality specific to the Secp256k1 elliptic curve cryptographic signature scheme.
 */
export class Secp256k1SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 65;


    getSignatureSchemeId(): number {
        return SignatureSchemeId.SECP256K1;
    }

    getSignatureSize(): number {
        return Secp256k1SignatureScheme.SIGNATURE_SIZE
    }

    getSignatureAlgorithmId(): SignatureSchemeId {
        return this.getSignatureSchemeId()
    }

    expectedSeedSize() {
        return 32;
    }
}

/**
 * A class representing a Secp256k1 public signature key. This class is responsible for
 * handling the public key operations such as retrieving the raw public key and verifying
 * signatures against specified data.
 *
 * This class extends the Secp256k1SignatureScheme and implements the PublicSignatureKey interface.
 */
export class Secp256k1PublicSignatureKey extends BasePublicSignatureKey {

    constructor(private publicKey: Uint8Array) {
        super();
    }

    getPublicKeyAsBytes(): Uint8Array {
        return this.publicKey;
    }

    verify(data: Uint8Array, signature: Uint8Array): boolean {
        const msgHash = sha256(data);
        return verify(signature, msgHash, this.publicKey);
    }

    getScheme(): SignatureScheme {
        return new Secp256k1SignatureScheme();
    }
}

/**
 * Represents a private signature key using the Secp256k1 curve. This class extends
 * from `Secp256k1PublicSignatureKey` and implements the `PrivateSignatureKey` interface.
 * It provides functionality to generate a private key, derive its corresponding
 * public key, and sign data.
 *
 * Methods enable key generation, retrieving the associated public key,
 * and signing cryptographic hashes.
 */
export class Secp256k1PrivateSignatureKey extends BasePrivateSignatureKey {
    constructor(private privateKey: PrivKey) {
        super()
    }

    getPrivateKeyAsString(encoder: EncoderInterface<Uint8Array, string>): string {
        return encoder.encode(this.getPrivateKeyAsBytes())
    }

    /**
     * Generates and returns a new instance of Secp256k1PrivateSignatureKey
     * initialized with a randomly generated private key.
     *
     * @return {Secp256k1PrivateSignatureKey} A new Secp256k1PrivateSignatureKey object.
     */
    static gen(): Secp256k1PrivateSignatureKey {
        return new Secp256k1PrivateSignatureKey(utils.randomPrivateKey());
    }

    /**
     * Generates a Secp256k1 private signature key from a given seed.
     *
     * @param {Uint8Array} seed - The seed used to generate the private key.
     * @return {Secp256k1PrivateSignatureKey} The generated Secp256k1 private signature key.
     */
    static genFromSeed(seed: Uint8Array) {
        return new Secp256k1PrivateSignatureKey(etc.bytesToHex(seed))
    }

    getPublicKey(): PublicSignatureKey {
        return new Secp256k1PublicSignatureKey(getPublicKey(this.privateKey));
    }

    getPrivateKeyAsBytes(): Uint8Array {
        if (this.privateKey instanceof Uint8Array) return this.privateKey;
        throw new Error("Invalid private key format: expected Uint8Array, got " + typeof this.privateKey + " instead.");
    }

    sign(data: Uint8Array): Uint8Array {
        const msgHash = sha256(data);
        return sign(msgHash, this.privateKey).toCompactRawBytes();
    }

    getScheme(): SignatureScheme {
        return new Secp256k1SignatureScheme();
    }
}