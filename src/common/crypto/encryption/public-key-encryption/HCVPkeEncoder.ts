import {PkeEncoderInterface} from "./PkeEncoderInterface";
import {AbstractPrivateDecryptionKey, AbstractPublicEncryptionKey} from "./PublicKeyEncryptionSchemeInterface";
import {EncoderFactory, EncoderInterface} from "../../../utils/encoder";
import {HCVCodec} from "../../../utils/HCVCodec";
import {CryptoSchemeFactory} from "../../CryptoSchemeFactory";

/*
export class HCVPkeEncoder implements PkeEncoderInterface {

    private static PKE_KEY = "PKE";
    private static SK_PKE_KEY = "SK";
    private static PK_PKE_KEY = "PK";
    private static PKE_ML_KEM = "PKE_ML_KEM";

    static createHexHCVPkeEncoder() {
        return new HCVPkeEncoder(EncoderFactory.bytesToHexEncoder());
    }

    static createBase64HCVSignatureEncoder() {
        return new HCVPkeEncoder(EncoderFactory.bytesToBase64Encoder());
    }

    constructor(private readonly  stringEncoder: EncoderInterface<Uint8Array, string>) {}


    decodePrivateDecryptionKey(privateKey: string): AbstractPrivateDecryptionKey {
        const result = HCVCodec.decode(privateKey);
        for (const {algoId, label} of .SIG_SCHEME_KEYS) {
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

    decodePublicEncryptionKey(key: string): AbstractPublicEncryptionKey {
        return undefined;
    }

    encodePrivateDecryptionKey(key: AbstractPrivateDecryptionKey): string {
        return "";
    }

    encodePublicEncryptionKey(key: AbstractPublicEncryptionKey): string {
        return "";
    }



}

 */