import {CryptoSchemeFactory} from "./crypto/factory";

export class Wallet {
    constructor( private walletSeed: string ) {
    }


    getPrivateSignatureKey( schemeId: number ) {
        const factory = new CryptoSchemeFactory();
        return factory.createPrivateSignatureKey( schemeId, this.walletSeed );
    }

    getDecapsulationKey( schemeId: number ) {
        const factory = new CryptoSchemeFactory();
        return factory.createDecapsulationKey( schemeId, this.walletSeed );
    }

    getVirtualBlockchainSignatureKey( schemeId: number, vbSeed: string ) {
        const factory = new CryptoSchemeFactory();
        return factory.createVirtualBlockchainPrivateSignatureScheme( schemeId, this.walletSeed, vbSeed );
    }

    getVirtualBlockchainDecapsulationKey( schemeId: number, vbSeed: string ) {
        const factory = new CryptoSchemeFactory();
        return factory.createVirtualBlockchainDecapsulationKey( schemeId, this.walletSeed, vbSeed );
    }
}