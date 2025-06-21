import {
    KeyExchangeAlgorithmId,
    DecapsulationKey, InsecureKeyExchangeScheme, EncapsulationKey,
} from "./encryption-interface.js";
import {
    PrivateSignatureKey, PublicSignatureKey,
    SignatureAlgorithmId,
    SignatureScheme
} from "./signature-interface.js";
import {hexToBytes} from "@noble/ciphers/utils";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicKeyEncoder} from "./signature/ml-dsa-65.js";

export class CryptoSchemeFactory {


    createPrivateSignatureKey( schemeId: number, walletSeed: string ): PrivateSignatureKey {
        const rawWalletSeed = hexToBytes(walletSeed);
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(rawWalletSeed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    createVirtualBlockchainPrivateSignatureScheme( schemeId: number, walletSeed: string , vbSeed: string ): PrivateSignatureKey {
        const rawWalletSeed = hexToBytes(walletSeed); // TODO: add the vbSeed
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PrivateSignatureKey(rawWalletSeed);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }


    createDecapsulationKey( schemeId: number, walletSeed: string  ): DecapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }

    createVirtualBlockchainDecapsulationKey( schemeId: number, walletSeed: string, vbSeed: string ): DecapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }



    createPublicSignatureKey( schemeId: number, publicKey: Uint8Array ): PublicSignatureKey {
        switch (schemeId) {
            case SignatureAlgorithmId.ML_DSA_65: return new MLDSA65PublicKeyEncoder().decodeFromUint8Array(publicKey);
            default: throw `Not supported signature scheme ID: ${schemeId}`
        }
    }

    createEncapsulationKey( schemeId: number, encapsulationKey: Uint8Array  ): EncapsulationKey {
        switch (schemeId) {
            case KeyExchangeAlgorithmId.INSECURE: return new InsecureKeyExchangeScheme();
            default: throw `Not supported encryption scheme ID: ${schemeId}`
        }
    }
}