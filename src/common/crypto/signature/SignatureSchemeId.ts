/**
 * An enumeration representing the identifiers for different signature algorithms.
 * This enum is used to indicate the type of cryptographic signature algorithm being utilized.
 *
 * Enum members:
 * - SECP256K1: Indicates the SECP256K1 signature algorithm, typically associated with elliptic-curve cryptography.
 * - ML_DSA_65: Represents the ML-DSA-65 signature algorithm.
 */
export enum SignatureSchemeId {
    SECP256K1 = 0,
    ML_DSA_65 = 1,
}