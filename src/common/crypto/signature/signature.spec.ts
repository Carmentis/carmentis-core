import {
    SignatureAlgorithmId
} from "../signature-interface";
import {toBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "../factory";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicKeyEncoder, MLDSA65PublicSignatureKey} from "./ml-dsa-65";
import {Secp256k1PrivateSignatureKey} from "./secp256k1";
import {GenericSignatureEncoder} from "./generic-signature-encoder";

describe('ML DSA 65 Signature', () => {
    test("Signature verification", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const publicKey = privateKey.getPublicKey();
        const msg  = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(publicKey.verify(msg, signature)).toBe(true);
    })

    test("Signature verification after encoding using encoder", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const encoder = new MLDSA65PublicKeyEncoder();
        const publicKey = privateKey.getPublicKey();
        const decodedPublicKey = encoder.decodeFromUint8Array(
            encoder.encodeAsUint8Array(publicKey)
        );

        const msg  = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(decodedPublicKey.verify(msg, signature)).toBe(true);
    })

    test("Signature verification after encoding using factory", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = privateKey.getPublicKey().getRawPublicKey();

        const cryptoFactory = new CryptoSchemeFactory();
        const publicKey = cryptoFactory.createPublicSignatureKey(SignatureAlgorithmId.ML_DSA_65, rawPublicKey);
        const msg  = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(publicKey.verify(msg, signature)).toBe(true);
    })

    test("Invalid factory usage", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = privateKey.getPublicKey().getRawPublicKey();

        const cryptoFactory = new CryptoSchemeFactory();
        expect(() => cryptoFactory.createPublicSignatureKey(-1, rawPublicKey)).toThrow();
    })
})

describe('Secp256k1 Signature', () => {
    test("Signature verification", () => {
        /*
        const privateKey = Secp256k1PrivateSignatureKey.gen();
        const publicKey = privateKey.getPublicKey();
        const msg = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(publicKey.verify(msg, signature)).toBe(true);

         */
    })
})


describe('Generic signature encoder', () => {
    test("", () => {
        const encoder = new GenericSignatureEncoder();

        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const publicKey = privateKey.getPublicKey();
        const rawPublicKey = encoder.encodeAsUint8Array(publicKey);
        const publicKey2 = encoder.decodeFromUint8Array(rawPublicKey);
        expect(publicKey2.getRawPublicKey()).toEqual(publicKey.getRawPublicKey());
        expect(publicKey2.getSignatureAlgorithmId()).toEqual(publicKey.getSignatureAlgorithmId());
    })
})