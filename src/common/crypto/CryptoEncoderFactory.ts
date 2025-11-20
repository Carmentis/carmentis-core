import { EncoderFactory } from "../utils/encoder";
import { HCVPkeEncoder } from "./encryption/public-key-encryption/HCVPkeEncoder";
import { PkeEncoderInterface } from "./encryption/public-key-encryption/PkeEncoderInterface";
import { HCVSignatureEncoder } from "./signature/HCVSignatureEncoder";
import { StringSignatureEncoder } from "./signature/signature-encoder";
import {SignatureEncoderInterface} from "./signature/SignatureEncoderInterface";


export class CryptoEncoderFactory {
    static defaultStringSignatureEncoder(): SignatureEncoderInterface<string> {
        return new HCVSignatureEncoder(EncoderFactory.defaultBytesToStringEncoder());
    } 

    static defaultStringPublicKeyEncryptionEncoder(): PkeEncoderInterface {
        return HCVPkeEncoder.createBase64HCVPkeEncoder();
    }
}