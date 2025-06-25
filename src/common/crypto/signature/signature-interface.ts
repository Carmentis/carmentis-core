import {EncoderInterface} from "../../utils/encoder";

/**
 * Represents a cryptographic signature scheme with methods to retrieve
 * identifying information and utilities for encoding public keys.
 */
export interface SignatureScheme  {
    getSignatureAlgorithmId(): number;
    getSignatureSize(): number;
}

/**
 * Represents a private signature key utilized in cryptographic operations.
 *
 * This interface extends the `SignatureScheme` and provides functionality
 * to generate a corresponding public key and to sign data.
 */
export interface PrivateSignatureKey extends SignatureScheme {
    getPublicKey(): PublicSignatureKey;
    sign(data: Uint8Array): Uint8Array;
    getPrivateKeyAsBytes(): Uint8Array;
}

/**
 * Represents a public signature key adhering to a specific signature scheme.
 * This interface provides methods to verify digital signatures and fetch the raw public key.
 *
 * @interface PublicSignatureKey
 * @extends SignatureScheme
 *
 * @method verify
 *   Verifies the digital signature for the provided data.
 *   @param {Uint8Array} data - The original data to be verified.
 *   @param {Uint8Array} signature - The digital signature corresponding to the provided data.
 *   @returns {boolean} - Returns true if the signature is valid for the data, false otherwise.
 *
 * @method getPublicKeyAsBytes
 *   Retrieves the raw representation of the public key.
 *   This is useful for serialization, transmission, or other forms of key processing.
 *   @returns {Uint8Array} - The raw bytes of the public key.
 */
export interface PublicSignatureKey extends SignatureScheme {
    verify(data: Uint8Array, signature: Uint8Array): boolean;
    getPublicKeyAsBytes(): Uint8Array;
}

/**
 * An enumeration representing the identifiers for different signature algorithms.
 * This enum is used to indicate the type of cryptographic signature algorithm being utilized.
 *
 * Enum members:
 * - SECP256K1: Indicates the SECP256K1 signature algorithm, typically associated with elliptic-curve cryptography.
 * - ML_DSA_65: Represents the ML-DSA-65 signature algorithm.
 */
export enum SignatureAlgorithmId {
    SECP256K1 = 0,
    ML_DSA_65 = 1,
}


