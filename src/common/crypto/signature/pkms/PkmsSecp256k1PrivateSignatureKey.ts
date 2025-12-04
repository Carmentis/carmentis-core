import {PrivateSignatureKey} from "../PrivateSignatureKey";
import {PublicSignatureKey} from "../PublicSignatureKey";
import {SignatureSchemeId} from "../SignatureSchemeId";
import {SignatureScheme} from "../SignatureScheme";
import {Secp256k1PublicSignatureKey, Secp256k1SignatureScheme} from "../secp256k1";
import {IPkmsCredentialProvider} from "./pkmsCredentialProvider/IPkmsCredentialProvider";
import {EnvApiKeyPkmsCredentialProvider} from "./pkmsCredentialProvider/EnvApiKeyPkmsCredentialProvider";

export interface PKMSClientOptions {
    host: string
}

const DEFAULT_PKMS_HOST = "https://pkms.admin.carmentis.io"
export class PkmsSecp256k1PrivateSignatureKey implements PrivateSignatureKey {

    private credentialProvider: IPkmsCredentialProvider = new EnvApiKeyPkmsCredentialProvider();

    constructor(private readonly keyId: string, private options: PKMSClientOptions = {host: DEFAULT_PKMS_HOST}) {
    }

    getKeyId(): string {
        return this.keyId;
    }





    getPrivateKeyAsBytes(): Uint8Array {
        throw new Error("Private key material cannot be exported.")
    }

    async getPublicKey(): Promise<PublicSignatureKey> {
        const getPublicKeyResponse = await fetch(`${this.options.host}/api/keys/${this.keyId}/pk`, {
            method: "GET",
            headers: {
                "Content-Type": "application/json"
            },
        });
        const body = await getPublicKeyResponse.json();
        const publicKey = new Uint8Array(Buffer.from(body.publicKey, 'base64'));
        return new PkmsSecp256k1PublicSignatureKey(publicKey)
    }

    getScheme(): SignatureScheme {
        return new Secp256k1SignatureScheme();
    }

    getSignatureSchemeId(): SignatureSchemeId {
        return SignatureSchemeId.PKMS_SECP256K1;
    }

    getSignatureSize(): number {
        return this.getScheme().getSignatureSize();
    }

    setCredentialProvider(credentialProvider: IPkmsCredentialProvider) {
        this.credentialProvider = credentialProvider;
    }

    async sign(data: Uint8Array): Promise<Uint8Array> {
        const apiKey = await this.credentialProvider.getPkmsCredential();
        try {
            const response = await fetch(`${this.options.host}/api/sign`, {
                method: "POST",
                headers: {
                    authorization: `Bearer ${apiKey}`,
                    "Content-Type": "application/json"
                },
                body: JSON.stringify({
                    keyId: this.keyId,
                    base64EncodedData: Buffer.from(data).toString('base64'),
                })
            });
            if (response.ok) {
                const signResponse = await response.json();
                return Buffer.from(signResponse.signature as string, "base64");
            } else {
                // TODO log
                throw new Error(`Failed to sign data.`)
            }
        } catch (e) {
            //TODO log
            throw e
        }
    }
}

export class PkmsSecp256k1PublicSignatureKey extends Secp256k1PublicSignatureKey {
    getSignatureSchemeId(): SignatureSchemeId {
        return SignatureSchemeId.PKMS_SECP256K1;
    }
}