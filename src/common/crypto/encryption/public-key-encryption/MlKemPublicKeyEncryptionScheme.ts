import {AbstractPublicKeyEncryptionScheme} from "./PublicKeyEncryptionSchemeInterface";
import {PublicKeyEncryptionAlgorithmId} from "./PublicKeyEncryptionAlgorithmId";

export class MlKemPublicKeyEncryptionScheme extends AbstractPublicKeyEncryptionScheme {
    getSchemeId(): PublicKeyEncryptionAlgorithmId {
        return PublicKeyEncryptionAlgorithmId.ML_KEM_768_AES_256_GCM;
    }

    getSupportedSeedLength(): number[] {
        return [32];
    }
}