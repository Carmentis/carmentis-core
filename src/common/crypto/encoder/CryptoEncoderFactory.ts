import {EncoderFactory, EncoderInterface} from "../../utils/encoder";
import {HCVPkeEncoder} from "../encryption/public-key-encryption/HCVPkeEncoder";
import {PkeEncoderInterface} from "../encryption/public-key-encryption/PkeEncoderInterface";
import {SignatureEncoderInterface} from "./signature/SignatureEncoderInterface";
import {HandlerBasedSignatureEncoder} from "./signature/HandlerBasedSignatureEncoder";
import {Encoder} from "cbor-x";

class CBORCryptoBinaryEncoder implements EncoderInterface<object, Uint8Array> {
    private static encoder = new Encoder({
        tagUint8Array: false,
        //encodeUndefinedAsNil: false,
        useRecords: true,
        copyBuffers: true,
        mapsAsObjects: true,
    });

    decode(data: Uint8Array): object {
        return CBORCryptoBinaryEncoder.encoder.decode(data);
    }

    encode(data: object): Uint8Array {
        return CBORCryptoBinaryEncoder.encoder.encode(data);
    }

}
export class CryptoEncoderFactory {
    static defaultStringSignatureEncoder(): SignatureEncoderInterface<string> {
        return new HandlerBasedSignatureEncoder(EncoderFactory.defaultBytesToStringEncoder());
    } 

    static defaultStringPublicKeyEncryptionEncoder(): PkeEncoderInterface {
        return HCVPkeEncoder.createBase64HCVPkeEncoder();
    }

    private static cryptoBinaryEncoder = new CBORCryptoBinaryEncoder();

    static getCryptoBinaryEncoder(): EncoderInterface<object, Uint8Array> {
        return CryptoEncoderFactory.cryptoBinaryEncoder;
    }
}