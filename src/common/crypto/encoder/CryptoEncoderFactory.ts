import {EncoderFactory} from "../../utils/encoder";
import {HCVPkeEncoder} from "../encryption/public-key-encryption/HCVPkeEncoder";
import {PkeEncoderInterface} from "../encryption/public-key-encryption/PkeEncoderInterface";
import {SignatureEncoderInterface} from "./signature/SignatureEncoderInterface";
import {HandlerBasedSignatureEncoder} from "./signature/HandlerBasedSignatureEncoder";


export class CryptoEncoderFactory {
    static defaultStringSignatureEncoder(): SignatureEncoderInterface<string> {
        return new HandlerBasedSignatureEncoder(EncoderFactory.defaultBytesToStringEncoder());
    } 

    static defaultStringPublicKeyEncryptionEncoder(): PkeEncoderInterface {
        return HCVPkeEncoder.createBase64HCVPkeEncoder();
    }
}