import {PrivateSignatureKey} from "./signature-interface.js";

export interface SymmetricEncryptionKey  {
    getEncryptionAlgorithmId(): number;
}


export enum SymmetricEncryptionAlgorithmId {
    AES_256_GCM,
    INSECURE,
}

export class InsecureSymmetricEncryptionKey implements SymmetricEncryptionKey {
    getEncryptionAlgorithmId(): number {
        return SymmetricEncryptionAlgorithmId.INSECURE;
    }

    decrypt(data: string): string {
        return data;
    }

    encrypt(data: string): string {
        return data;
    }
}




export interface DecapsulationKey  {
    decapsulate(ct: string): SymmetricEncryptionKey;
    getEncapsulationKey(): EncapsulationKey;
}

export interface EncapsulationKey  {
    encapsulate(): { key: SymmetricEncryptionKey, ct: string };
}

export interface EncapsulationKeyEncoder<T> {
    encode( key: T ): string;
    decode( key: string ): T;
}

export enum KeyExchangeAlgorithmId {
    ML_KEM,
    INSECURE,
}

export class InsecureKeyExchangeScheme implements EncapsulationKey, DecapsulationKey {
    getEncapsulationKey(): EncapsulationKey {
        return this;
    }

    encapsulate(): { key: SymmetricEncryptionKey; ct: string } {
        return {
            key: new InsecureSymmetricEncryptionKey(),
            ct: ""
        }
    }

    getEncryptionAlgorithmId(): number {
        return KeyExchangeAlgorithmId.INSECURE;
    }

    decapsulate(ct: string): SymmetricEncryptionKey {
        return new InsecureSymmetricEncryptionKey();
    }
}