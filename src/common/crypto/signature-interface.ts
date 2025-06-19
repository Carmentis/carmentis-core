import {ml_dsa44} from "@noble/post-quantum/ml-dsa";
import {randomBytes} from "@noble/post-quantum/utils";


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
    ML_DSA_44 = 1,
    INSECURE = 2
}


export class MLDSA44SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 65;

    getSignatureAlgorithmId(): number {
        return SignatureAlgorithmId.ML_DSA_44;
    }

    getSignatureSize(): number {
        return MLDSA44SignatureScheme.SIGNATURE_SIZE;
    }

    getPublicKeyEncoder(): PublicSignatureKeyEncoder<SignatureScheme> {
        return new MLDSA44PublicKeyEncoder();
    }
}


export class MLDSA44PublicSignatureKey extends MLDSA44SignatureScheme implements PublicSignatureKey {
    constructor( protected publicKey: Uint8Array ) {
        super();
    }


    verify(data: Uint8Array, signature: Uint8Array): boolean {
        return ml_dsa44.verify(
            this.publicKey,
            data,
            signature
        );
    }

    getRawPublicKey(): Uint8Array {
        return this.publicKey;
    }
}


export class MLDSA44PrivateSignatureKey extends MLDSA44PublicSignatureKey implements PrivateSignatureKey {

    public static gen(): PrivateSignatureKey {
        const seed = randomBytes(32);
        const keys = ml_dsa44.keygen(seed);
        return new MLDSA44PrivateSignatureKey(keys.secretKey);
    }

    private signatureKey: Uint8Array;
    constructor( private seed: Uint8Array ) {
        const keys = ml_dsa44.keygen(seed);
        super(keys.publicKey);
        this.signatureKey = keys.secretKey;
    }



    getPublicKey(): PublicSignatureKey {
        return this;
    }

    sign(data: Uint8Array): Uint8Array {
        return ml_dsa44.sign(
            this.signatureKey,
            data
        );
    }



}


export class MLDSA44PublicKeyEncoder implements PublicSignatureKeyEncoder<MLDSA44PublicSignatureKey> {
    decodeFromUint8Array(publicKey: Uint8Array): MLDSA44PublicSignatureKey {
        return new MLDSA44PublicSignatureKey(publicKey);
    }

    encodeAsUint8Array(publicKey: MLDSA44PublicSignatureKey): Uint8Array {
        return publicKey.getRawPublicKey();
    }
}