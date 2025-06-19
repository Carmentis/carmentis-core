import {
    MLDSA65PrivateSignatureKey,
    MLDSA65PublicKeyEncoder,
    MLDSA65PublicSignatureKey,
    SignatureAlgorithmId
} from "./signature-interface";
import {toBytes} from "@noble/ciphers/utils";
import {CryptoSchemeFactory} from "./factory";

describe('crypto', () => {
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