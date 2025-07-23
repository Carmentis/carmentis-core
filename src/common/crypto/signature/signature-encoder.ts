import {PrivateSignatureKey, PublicSignatureKey} from "./signature-interface";
import {CryptoSchemeFactory} from "../CryptoSchemeFactory";
import {bytesToHex, bytesToUtf8, hexToBytes} from "@noble/ciphers/utils";
import {utf8ToBytes} from "@noble/hashes/utils";
import {EncoderFactory, EncoderInterface} from "../../utils/encoder";


/**
 * An interface for encoding and decoding cryptographic signature keys and signatures.
 *
 * Provides methods to encode and decode public keys, private keys, and signatures
 * into or from a specified format `T`.
 *
 * @template T - The format type for encoded keys and signatures.
 */
export interface SignatureEncoderInterface<T> {
    /**
     * Encodes the given public signature key into a specific format.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key that needs to be encoded.
     * @return {T} The encoded representation of the public signature key.
     */
    encodePublicKey( publicKey: PublicSignatureKey ): T;
    /**
     * Decodes a given public key object into a public signature key.
     *
     * @param {T} publicKey - The public key object that needs to be decoded.
     * @return {PublicSignatureKey} The decoded public signature key.
     */
    decodePublicKey( publicKey: T ): PublicSignatureKey;
    /**
     * Encodes the given private key into a specific format.
     *
     * @param {PrivateSignatureKey} privateKey - The private key to be encoded.
     * @return {T} The encoded representation of the private key.
     */
    encodePrivateKey( privateKey: PrivateSignatureKey ): T;
    /**
     * Decodes the provided private key and returns a private signature key object.
     *
     * @param {T} privateKey - The private key to decode.
     * @return {PrivateSignatureKey} A decoded private signature key object.
     */
    decodePrivateKey( privateKey: T ): PrivateSignatureKey;
    /**
     * Encodes a given digital signature into a specific format.
     *
     * @param {Uint8Array} signature - The digital signature to be encoded. It should be provided as a Uint8Array.
     * @return {T} The encoded signature in the required format, where T represents the resulting type of the encoded output.
     */
    encodeSignature( signature: Uint8Array ): T;
    /**
     * Decodes the provided signature into a Uint8Array.
     *
     * @param {T} signature - The signature to be decoded.
     * @return {Uint8Array} The decoded signature as a Uint8Array.
     */
    decodeSignature( signature: T ): Uint8Array;
    /**
     * Encodes a given message into a specific format.
     *
     * @param {Uint8Array} message - The message to be encoded, provided as a Uint8Array.
     * @return {T} The encoded message in the specified format.
     */
    encodeMessage( message: Uint8Array ): T;
    /**
     * Decodes the provided message into a Uint8Array.
     *
     * @param {T} message - The message to be decoded. The type of the message is generic and should be specified upon usage.
     * @return {Uint8Array} - The decoded representation of the input message as a Uint8Array.
     */
    decodeMessage( message: T ): Uint8Array;
}

/**
 * Class responsible for encoding and decoding digital signature-related data.
 * Provides methods to convert signatures, public keys, and private keys between raw formats and serialized representations.
 */
export class BytesSignatureEncoder implements SignatureEncoderInterface<Uint8Array>{
    encodeSignature(signature: Uint8Array): Uint8Array<ArrayBufferLike> {
        return signature
    }
    decodeSignature(signature: Uint8Array<ArrayBufferLike>): Uint8Array {
        return signature;
    }

    encodeMessage(message: Uint8Array): Uint8Array<ArrayBufferLike> {
        return message;
    }
    decodeMessage(message: Uint8Array<ArrayBufferLike>): Uint8Array {
        return message;
    }


    encodePublicKey(publicKey: PublicSignatureKey): Uint8Array {
        return utf8ToBytes(JSON.stringify({
            signatureSchemeId: publicKey.getSignatureAlgorithmId(),
            publicKey: bytesToHex(publicKey.getPublicKeyAsBytes())
        }));
    }
    
    
    decodePublicKey(publicKey: Uint8Array): PublicSignatureKey {
        const items = JSON.parse(bytesToUtf8(publicKey));
        if (items && typeof items.signatureSchemeId === "number" && typeof items.publicKey === "string") {
            const rawPublicKey = hexToBytes(items.publicKey);
            const factory = new CryptoSchemeFactory();
            return factory.createPublicSignatureKey(items.signatureSchemeId, rawPublicKey);
        } else {
            throw "Invalid public key format: expected raw-encoded JSON object with signatureSchemeId and publicKey fields."
        }
    }

    encodePrivateKey(privateKey: PrivateSignatureKey): Uint8Array {
        return utf8ToBytes(JSON.stringify({
            signatureSchemeId: privateKey.getSignatureAlgorithmId(),
            privateKey: bytesToHex(privateKey.getPrivateKeyAsBytes())
        }));
    }


    decodePrivateKey(privateKey: Uint8Array): PrivateSignatureKey {
        const items = JSON.parse(bytesToUtf8(privateKey));
        if (items && typeof items.signatureSchemeId === "number" && typeof items.privateKey === "string") {
            const rawPublicKey = hexToBytes(items.privateKey);
            return CryptoSchemeFactory.createPrivateSignatureKey(items.signatureSchemeId, rawPublicKey);
        } else {
            throw "Invalid public key format: expected raw-encoded JSON object with signatureSchemeId and privateKey fields."
        }
    }
}


/**
 * The StringSignatureEncoder class provides encoding and decoding methods for public keys,
 * private keys, and digital signatures. It acts as an intermediate layer, converting between
 * string representations and their binary counterparts using a combination of a bytes encoder
 * and another signature encoder.
 */
export class StringSignatureEncoder implements SignatureEncoderInterface<string> {
    
    /**
     * Constructs an instance of the class with the provided encoders.
     *
     * @param {EncoderInterface<Uint8Array, string>} bytesEncoder - The encoder used to encode or decode bytes.
     * @param {SignatureEncoderInterface<Uint8Array>} [signatureEncoder=new BytesSignatureEncoder()] - The encoder used to handle signature encoding. Defaults to a new instance of BytesSignatureEncoder.
     * @return {void}
     */
    constructor(
        private bytesEncoder: EncoderInterface<Uint8Array, string>,
        private signatureEncoder: SignatureEncoderInterface<Uint8Array> = new BytesSignatureEncoder()
    ) {}

    /**
     * Provides the default encoder for string signatures by utilizing the default bytes-to-string encoder
     * from the EncoderFactory.
     *
     * @return {StringSignatureEncoder} The default string signature encoder instance.
     */
    static defaultStringSignatureEncoder(): StringSignatureEncoder {
        return new StringSignatureEncoder(EncoderFactory.defaultBytesToStringEncoder());
    }

    static defaultBytesSignatureEncoder(): BytesSignatureEncoder {
        return new BytesSignatureEncoder();
    }

    /**
     * Encodes a given public signature key into its string representation.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key to be encoded.
     * @return {string} The encoded string representation of the public signature key.
     */
    encodePublicKey(publicKey: PublicSignatureKey): string {
        return this.bytesEncoder.encode(
            this.signatureEncoder.encodePublicKey(publicKey)
        )
    }

    /**
     * Decodes the provided public key string into a PublicSignatureKey object.
     *
     * @param {string} publicKey - The public key string to be decoded.
     * @return {PublicSignatureKey} The decoded PublicSignatureKey object.
     */
    decodePublicKey(publicKey: string): PublicSignatureKey {
        return this.signatureEncoder.decodePublicKey(
            this.bytesEncoder.decode(publicKey)
        )
    }

    /**
     * Decodes a given private key from its string representation to a PrivateSignatureKey object.
     *
     * @param {string} privateKey - The private key in its encoded string format to be decoded.
     * @return {PrivateSignatureKey} - The decoded private key as a PrivateSignatureKey object.
     */
    decodePrivateKey(privateKey: string): PrivateSignatureKey {
        return this.signatureEncoder.decodePrivateKey(
            this.bytesEncoder.decode(privateKey)
        );
    }

    /**
     * Decodes a given signature string into a Uint8Array.
     *
     * @param {string} signature - The signature string to decode.
     * @return {Uint8Array} The decoded signature as a Uint8Array.
     */
    decodeSignature(signature: string): Uint8Array {
        return this.signatureEncoder.decodeSignature(
            this.bytesEncoder.decode(signature)
        );
    }

    /**
     * Encodes a given private key into a string format.
     *
     * @param {PrivateSignatureKey} privateKey - The private key to be encoded.
     * @return {string} The encoded private key as a string.
     */
    encodePrivateKey(privateKey: PrivateSignatureKey): string {
        return this.bytesEncoder.encode(
            this.signatureEncoder.encodePrivateKey(privateKey)
        );
    }

    /**
     * Encodes a given signature into a string format.
     *
     * @param {Uint8Array} signature - The signature to be encoded, represented as a Uint8Array.
     * @return {string} The encoded string representation of the provided signature.
     */
    encodeSignature(signature: Uint8Array): string {
        return this.bytesEncoder.encode(
            this.signatureEncoder.encodeSignature(signature)
        )
    }

    /**
     * Decodes the given encoded message string into a Uint8Array.
     *
     * @param {string} message - The encoded message as a string.
     * @return {Uint8Array} The decoded message represented as a Uint8Array.
     */
    decodeMessage(message: string): Uint8Array {
        return this.bytesEncoder.decode(message);
    }

    /**
     * Encodes a given Uint8Array message into a string format.
     *
     * @param {Uint8Array} message - The message to be encoded as a Uint8Array.
     * @return {string} The encoded message as a string.
     */
    encodeMessage(message: Uint8Array): string {
        return this.bytesEncoder.encode(message);
    }
}