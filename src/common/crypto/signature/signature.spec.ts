import {
    SignatureAlgorithmId
} from "./signature-interface";
import {toBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "../factory";
import {MLDSA65PrivateSignatureKey, MLDSA65PublicSignatureKey} from "./ml-dsa-65";
import {Secp256k1PrivateSignatureKey} from "./secp256k1";
import {BytesSignatureEncoder} from "./signature-encoder";

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
        const encoder = new BytesSignatureEncoder();
        const publicKey = privateKey.getPublicKey();
        const decodedPublicKey = encoder.decodePublicKey(
            encoder.encodePublicKey(publicKey)
        );

        const msg  = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(decodedPublicKey.verify(msg, signature)).toBe(true);
    })

    test("Signature verification after encoding using factory", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = privateKey.getPublicKey().getPublicKeyAsBytes();

        const cryptoFactory = new CryptoSchemeFactory();
        const publicKey = cryptoFactory.createPublicSignatureKey(SignatureAlgorithmId.ML_DSA_65, rawPublicKey);
        const msg  = toBytes("Hello world");
        const signature = privateKey.sign(msg);
        expect(publicKey.verify(msg, signature)).toBe(true);
    })

    test("Invalid factory usage", () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const rawPublicKey = privateKey.getPublicKey().getPublicKeyAsBytes();

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
        const encoder = new BytesSignatureEncoder();

        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const publicKey = privateKey.getPublicKey();
        const rawPublicKey = encoder.encodePublicKey(publicKey);
        const publicKey2 = encoder.decodePublicKey(rawPublicKey);
        expect(publicKey2.getPublicKeyAsBytes()).toEqual(publicKey.getPublicKeyAsBytes());
        expect(publicKey2.getSignatureAlgorithmId()).toEqual(publicKey.getSignatureAlgorithmId());
    })
})