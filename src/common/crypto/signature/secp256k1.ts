import {PublicSignatureKeyEncoder, SignatureScheme} from "../signature-interface";

export class Secp256k1SignatureScheme implements SignatureScheme {
    private static SIGNATURE_SIZE = 65;

    getPublicKeyEncoder(): PublicSignatureKeyEncoder<SignatureScheme> {
        // TODO
        throw 'Not implemented';
    }

    getSignatureAlgorithmId(): number {
        throw 'Not implemented';
    }

    getSignatureSize(): number {
        return Secp256k1SignatureScheme.SIGNATURE_SIZE
    }
}