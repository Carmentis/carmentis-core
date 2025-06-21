import {PublicSignatureKey, PublicSignatureKeyEncoder} from "../signature-interface";
import {CryptoSchemeFactory} from "../factory";
import {bytesToHex, bytesToUtf8, hexToBytes} from "@noble/ciphers/utils";
import {utf8ToBytes} from "@noble/hashes/utils";

/**
 * GenericSignatureEncoder provides methods for encoding and decoding
 * public signature keys to and from Uint8Array format. This class
 * implements the PublicSignatureKeyEncoder interface for handling
 * signature key operations.
 *
 * The encoding process converts a public signature key into a raw
 * JSON object containing a signature scheme ID and the associated
 * public key information, which is further transformed into a
 * Uint8Array. The decoding reverses this process, reconstructing
 * the public signature key object.
 */
export class GenericSignatureEncoder implements PublicSignatureKeyEncoder<PublicSignatureKey> {

    /**
     * Decodes a public key from a Uint8Array and converts it into a PublicSignatureKey object.
     *
     * @param {Uint8Array} publicKey - The public key in Uint8Array format to decode. Expected to be a raw-encoded JSON object with `signatureSchemeId` and `publicKey` fields.
     * @return {PublicSignatureKey} The decoded PublicSignatureKey object created from the provided Uint8Array.
     * @throws {string} Throws an error if the input does not conform to the expected format or contains invalid data.
     */
    decodeFromUint8Array(publicKey: Uint8Array): PublicSignatureKey {
        const items = JSON.parse(bytesToUtf8(publicKey));
        if (items && typeof items.signatureSchemeId === "number" && typeof items.publicKey === "string") {
            const rawPublicKey = hexToBytes(items.publicKey);
            const factory = new CryptoSchemeFactory();
            return factory.createPublicSignatureKey(items.signatureSchemeId, rawPublicKey);
        } else {
            throw "Invalid public key format: expected raw-encoded JSON object with signatureSchemeId and publicKey fields."
        }
    }

    /**
     * Encodes the given public key as a Uint8Array.
     *
     * @param {PublicSignatureKey} publicKey - The public signature key that includes the signature algorithm ID and raw public key.
     * @return {Uint8Array} A Uint8Array representing the encoded public key.
     */
    encodeAsUint8Array(publicKey: PublicSignatureKey): Uint8Array {
        return utf8ToBytes(JSON.stringify({
            signatureSchemeId: publicKey.getSignatureAlgorithmId(),
            publicKey: bytesToHex(publicKey.getRawPublicKey())
        }));
    }
}