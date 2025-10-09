import {EncoderInterface} from "../../../utils/encoder";
import {AbstractPrivateDecryptionKey, AbstractPublicEncryptionKey} from "./PublicKeyEncryptionSchemeInterface";

export interface PublicEncryptionKeyEncoderInterface extends EncoderInterface<AbstractPublicEncryptionKey, string> {}
export interface PrivateDecryptionKeyEncoderInterface extends EncoderInterface<AbstractPrivateDecryptionKey, string> {}
export interface PkeEncoderInterface {
    encodePublicEncryptionKey(key: AbstractPublicEncryptionKey): string;
    encodePrivateDecryptionKey(key: AbstractPrivateDecryptionKey): string;
    decodePublicEncryptionKey(key: string): AbstractPublicEncryptionKey;
    decodePrivateDecryptionKey(key: string): AbstractPrivateDecryptionKey;
}