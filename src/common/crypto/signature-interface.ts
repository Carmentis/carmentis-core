export interface SignatureScheme  {
    getSignatureAlgorithmId(): number;
    getSignatureSize(): number;
    getPublicKeyEncoder(): PublicSignatureKeyEncoder<SignatureScheme>
}

export interface PrivateSignatureKey extends SignatureScheme {
    getPublicKey(): PublicSignatureKey;
    sign(data: Uint8Array): Uint8Array;
}

export interface PublicSignatureKey extends SignatureScheme {
    verify(data: Uint8Array, signature: Uint8Array): boolean;
    getRawPublicKey(): Uint8Array;
}

export interface PublicSignatureKeyEncoder<T> {
    encodeAsUint8Array( publicKey: T ): Uint8Array;
    decodeFromUint8Array( publicKey: Uint8Array ): T;
}




export enum SignatureAlgorithmId {
    SECP256K1 = 0,
    ML_DSA_65 = 1,
    INSECURE = 2
}


