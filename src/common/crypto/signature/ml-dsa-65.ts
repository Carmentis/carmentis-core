import {ml_dsa65} from "@noble/post-quantum/ml-dsa";
import {randomBytes} from "@noble/post-quantum/utils";
import {
    PrivateSignatureKey,
    PublicSignatureKey,
    PublicSignatureKeyEncoder,
    SignatureAlgorithmId,
    SignatureScheme
} from "../signature-interface.js";

export class MLDSA65SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 3311;

    getSignatureAlgorithmId(): number {
        return SignatureAlgorithmId.ML_DSA_65;
    }

    getSignatureSize(): number {
        return MLDSA65SignatureScheme.SIGNATURE_SIZE;
    }

    getPublicKeyEncoder(): PublicSignatureKeyEncoder<SignatureScheme> {
        return new MLDSA65PublicKeyEncoder();
    }
}

/**
 * Represents a public signature key for the MLDSA44 signature scheme.
 *
 * This class provides functionalities to verify digital signatures and retrieve
 * the raw public key used in the signing process. It extends the `MLDSA44SignatureScheme`
 * and implements the `PublicSignatureKey` interface.
 */
export class MLDSA65PublicSignatureKey extends MLDSA65SignatureScheme implements PublicSignatureKey {
    /**
     * Constructs an instance of the class.
     *
     * @param {Uint8Array} publicKey - The public key used for initialization.
     * @return {void} This constructor does not return a value.
     */
    constructor(protected publicKey: Uint8Array) {
        super();
    }


    /**
     * Verifies the provided data and its signature using the stored public key.
     *
     * @param {Uint8Array} data - The data to be verified.
     * @param {Uint8Array} signature - The signature of the data to be verified.
     * @return {boolean} Returns true if the verification is successful, otherwise false.
     */
    verify(data: Uint8Array, signature: Uint8Array): boolean {
        return ml_dsa65.verify(
            this.publicKey,
            data,
            signature
        );
    }

    /**
     * Retrieves the raw public key as a Uint8Array.
     *
     * @return {Uint8Array} The public key in its raw byte form.
     */
    getRawPublicKey(): Uint8Array {
        return this.publicKey;
    }
}

/**
 *
 */
export class MLDSA65PrivateSignatureKey extends MLDSA65PublicSignatureKey implements PrivateSignatureKey {

    /**
     * Generates and returns a new private signature key.
     *
     * This method creates a private signature key instance using a randomly generated 32-byte seed.
     *
     * @return {MLDSA65PrivateSignatureKey} A new instance of MLDSA65PrivateSignatureKey initialized with a randomly generated seed.
     */
    public static gen(): MLDSA65PrivateSignatureKey {
        const seed = randomBytes(32);
        return new MLDSA65PrivateSignatureKey(seed);
    }

    private signatureKey: Uint8Array;

    /**
     * Constructs a new instance of the class, initializes the public and private keys
     * using the provided seed value.
     *
     * @param {Uint8Array} seed - The seed value used to generate key pairs.
     * @return {void}
     */
    constructor(private seed: Uint8Array) {
        const keys = ml_dsa65.keygen(seed);
        super(keys.publicKey);
        this.signatureKey = keys.secretKey;
    }


    /**
     * Retrieves the public signature key associated with this instance.
     *
     * @return {MLDSA65PublicSignatureKey} The public signature key.
     */
    getPublicKey(): MLDSA65PublicSignatureKey {
        return this;
    }

    /**
     * Signs the provided data using the signature key.
     *
     * @param {Uint8Array} data - The data to be signed.
     * @return {Uint8Array} The generated signature for the provided data.
     */
    sign(data: Uint8Array): Uint8Array {
        return ml_dsa65.sign(
            this.signatureKey,
            data
        );
    }


}

/**
 * Class responsible for encoding and decoding MLDSA44 public signature keys.
 * This implementation provides methods to handle conversions between
 * `MLDSA65PublicSignatureKey` objects and their `Uint8Array` byte representations.
 */
export class MLDSA65PublicKeyEncoder implements PublicSignatureKeyEncoder<MLDSA65PublicSignatureKey> {
    /**
     * Decodes a Uint8Array input to generate an MLDSA44PublicSignatureKey instance.
     *
     * @param {Uint8Array} publicKey - The Uint8Array containing the public key data that needs*/
    decodeFromUint8Array(publicKey: Uint8Array): MLDSA65PublicSignatureKey {
        return new MLDSA65PublicSignatureKey(publicKey);
    }

    /**
     * Encodes the specified public key as a Uint8Array.
     *
     * @param {MLDSA65PublicSignatureKey} publicKey - The public signature key to encode.
     * @return {Uint8Array} The encoded public key as a Uint8Array.
     */
    encodeAsUint8Array(publicKey: MLDSA65PublicSignatureKey): Uint8Array {
        return publicKey.getRawPublicKey();
    }
}