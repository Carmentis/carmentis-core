import {Provider} from "./provider";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";

export class KeyedProvider extends Provider {
    private signatureKey: PrivateSignatureKey;
    constructor(signatureKey: PrivateSignatureKey, internalProvider: any, externalProvider: any) {
        super(internalProvider, externalProvider);
        this.signatureKey = signatureKey;
    }

    isKeyed(): boolean {
        return true;
    }


    getPrivateSignatureKey(): PrivateSignatureKey {
        return this.signatureKey;
    }

    getPublicSignatureKey(): PublicSignatureKey {
        return this.signatureKey.getPublicKey();
    }


}