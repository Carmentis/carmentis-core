import {SignatureEncoderInterface} from "./signature-encoder";
import {PrivateSignatureKey, PublicSignatureKey, SignatureSchemeId, SignatureScheme} from "./signature-interface";
import {EncoderFactory, EncoderInterface} from "../../utils/encoder";
import {HCVCodec} from "../../utils/HCVCodec";
import {CryptoSchemeFactory} from "../CryptoSchemeFactory";

export class HCVSignatureEncoder implements SignatureEncoderInterface<string> {

    private static SIGNATURE_KEY = "SIG";
    private static SK_SIGNATURE_KEY = "SK";
    private static PK_SIGNATURE_KEY = "PK";
    private static ML_DSA65_SIGNATURE_KEY = "MLDSA65";
    private static SECP256K1_SIGNATURE_KEY = "SECP256K1";

    private static readonly SIG_SCHEME_KEYS = [
        { algoId: SignatureSchemeId.ML_DSA_65, label: HCVSignatureEncoder.ML_DSA65_SIGNATURE_KEY },
        { algoId: SignatureSchemeId.SECP256K1, label: HCVSignatureEncoder.SECP256K1_SIGNATURE_KEY }
    ];

    static createHexHCVSignatureEncoder() {
        return new HCVSignatureEncoder(EncoderFactory.bytesToHexEncoder());
    }

    static createBase64HCVSignatureEncoder() {
        return new HCVSignatureEncoder(EncoderFactory.bytesToBase64Encoder());
    }

    constructor(private readonly  stringEncoder: EncoderInterface<Uint8Array, string>) {}

    decodeMessage(message: string): Uint8Array {
        return this.stringEncoder.decode(message);
    }

    decodePrivateKey(privateKey: string): PrivateSignatureKey {
        const result = HCVCodec.decode(privateKey);
        for (const {algoId, label} of HCVSignatureEncoder.SIG_SCHEME_KEYS) {
            const matches = result.matchesKeys(
                HCVSignatureEncoder.SIGNATURE_KEY,
                label,
                HCVSignatureEncoder.SK_SIGNATURE_KEY
            );
            if (matches) {
                return CryptoSchemeFactory.createPrivateSignatureKey(algoId, this.stringEncoder.decode(result.getValue()));
            }
        }
        throw new Error("Invalid private key format: no signature scheme key found");
    }

    decodePublicKey(publicKey: string): PublicSignatureKey {
        const result = HCVCodec.decode(publicKey);
        for (const {algoId, label} of HCVSignatureEncoder.SIG_SCHEME_KEYS) {
            const matches = result.matchesKeys(
                HCVSignatureEncoder.SIGNATURE_KEY,
                label,
                HCVSignatureEncoder.PK_SIGNATURE_KEY
            );
            if (matches) {
                return CryptoSchemeFactory.createPublicSignatureKey(algoId, this.stringEncoder.decode(result.getValue()));
            }
        }
        throw new Error("Invalid private key format: no signature scheme key found");
    }

    decodeSignature(signature: string): Uint8Array {
        return this.stringEncoder.decode(signature);
    }

    encodeMessage(message: Uint8Array): string {
        return this.stringEncoder.encode(message);
    }

    encodePrivateKey(privateKey: PrivateSignatureKey): string {
        const algoIdKey = this.getSignatureSchemeKey(privateKey.getScheme());
        return HCVCodec.encode(
            HCVSignatureEncoder.SIGNATURE_KEY,
            algoIdKey,
            HCVSignatureEncoder.SK_SIGNATURE_KEY,
            this.stringEncoder.encode(privateKey.getPrivateKeyAsBytes())
        )
    }

    encodePublicKey(publicKey: PublicSignatureKey): string {
        const algoIdKey = this.getSignatureSchemeKey(publicKey.getScheme());
        return HCVCodec.encode(
            HCVSignatureEncoder.SIGNATURE_KEY,
            algoIdKey,
            HCVSignatureEncoder.PK_SIGNATURE_KEY,
            this.stringEncoder.encode(publicKey.getPublicKeyAsBytes())
        );
    }

    encodeSignature(signature: Uint8Array): string {
        return this.stringEncoder.encode(signature);
    }

    private getSignatureSchemeKey(signatureScheme: SignatureScheme) {
        const algoId = signatureScheme.getSignatureSchemeId();
        switch (algoId) {
            case SignatureSchemeId.ML_DSA_65: return HCVSignatureEncoder.ML_DSA65_SIGNATURE_KEY;
            case SignatureSchemeId.SECP256K1: return HCVSignatureEncoder.SECP256K1_SIGNATURE_KEY;
            default: throw new Error("Unsupported signature scheme: " + algoId);
        }
    }

}