import * as SCHEMAS from "../../common/constants/schemas";
import {SchemaUnserializer} from "../../common/data/schemaSerializer";
import * as network from "../../common/network/network";
import {StringSignatureEncoder} from "../../common/crypto/signature/signature-encoder";
import {AccountCrypto} from "../../common/wallet/AccountCrypto";
import {HCVPkeEncoder} from "../../common/crypto/encryption/public-key-encryption/HCVPkeEncoder";
import {
    PublicKeyEncryptionSchemeId
} from "../../common/crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {PrivateSignatureKey} from "../../common/crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../../common/crypto/signature/SignatureSchemeId";

export abstract class wiWallet<T> {

    constructor() {
    }

    decodeRequest(requestType: any, request: any) {
        const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_REQUESTS[requestType])
        let requestObject = schemaSerializer.unserialize(request);

        let req = {
            type: requestType,
            object: requestObject
        };

        return req;
    }

    abstract formatAnswer(answerType: number, object: any): {answerType: number, answer: T};

    /**
     * Signs a request of authentication by public key. Returns the answer in the format expected by the application front.
     *
     * @param {PrivateSignatureKey} privateKey
     * @param object
     * @returns {*}
     */
    async signAuthenticationByPublicKey(privateKey: PrivateSignatureKey, object: any) {
        /*
        let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
            signature = crypto.secp256k1.sign(privateKey, object.challenge);
         */
        const challenge = object.challenge;
        const signature = await privateKey.sign(challenge);
        const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();

        let answerObject = {
            publicKey: signatureEncoder.encodePublicKey(await privateKey.getPublicKey()),
            signature: signatureEncoder.encodeSignature(signature),
        };

        return this.formatAnswer(
            SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
            answerObject
        );
    }



    /**
     * Gets the approval data identified by object.anchorRequestId, from the operator at object.serverUrl.*
     *
     * @returns {Promise<*>}
     */
    async getApprovalData(accountCrypto: AccountCrypto, object: { serverUrl: string, anchorRequestId: string }) {
        //async getApprovalData(privateKey: PrivateSignatureKey, walletSeed: Uint8Array, object: { serverUrl: string, anchorRequestId: string }) {

        // send an initial message approval handshake containing the anchorRequestId provided by the web client.
        let answer = await network.sendWalletToOperatorMessage<{ genesisSeed?: Uint8Array, data: Uint8Array }>(
            object.serverUrl,
            SCHEMAS.MSG_APPROVAL_HANDSHAKE,
            {
                anchorRequestId: object.anchorRequestId
            }
        );
        console.log("Received getApprovalData answer: ", answer)

        // In case where the actor public key is required for this interaction, the user provides a derived key
        if(network.getLastAnswerId() == SCHEMAS.MSG_ANS_ACTOR_KEY_REQUIRED) {
            console.debug("Operator asking for actor key: proceeding to the actor key generation")

            // asserts that the genesisSeed is provided by the operator
            const genesisSeed = answer.genesisSeed;
            if (genesisSeed === undefined) throw 'Invalid genesisSeed provided, expected string, got: ' + typeof genesisSeed;

            // derive the actor key from the private key and the genesis seed
            const actorCrypto = accountCrypto.deriveActorFromVbSeed(genesisSeed);
            /*
            const schemeId = privateKey.getSignatureSchemeId();
            const kdf = CryptoSchemeFactory.createDefaultKDF();
            const actorSignaturePrivateKey = CryptoSchemeFactory.createVirtualBlockchainPrivateSignature(
                kdf,
                schemeId,
                walletSeed,
                genesisSeed
            );
             */

            // TODO: decide the signature and pke scheme id
            // derive the actor public signature key
            const signatureSchemeId = SignatureSchemeId.SECP256K1;
            const actorSignaturePublicKey = await actorCrypto.getPublicSignatureKey(signatureSchemeId);

            // derive the actor public encryption key
            const pkeSchemeId = PublicKeyEncryptionSchemeId.ML_KEM_768_AES_256_GCM;
            const actorPublicEncryptionKey = await actorCrypto.getPublicEncryptionKey(pkeSchemeId);

            // send the actor key to the operator and awaits for the response
            const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
            const pkeEncoder = HCVPkeEncoder.createBase64HCVPkeEncoder();
            answer = await network.sendWalletToOperatorMessage<{data: Uint8Array}>(
                object.serverUrl,
                SCHEMAS.MSG_ACTOR_KEY,
                {
                    anchorRequestId: object.anchorRequestId,
                    actorSignaturePublicKey: signatureEncoder.encodePublicKey(actorSignaturePublicKey),
                    actorPkePublicKey: pkeEncoder.encodePublicEncryptionKey(actorPublicEncryptionKey)
                }
            );
        }

        // abort if the protocol ends badly
        if(network.getLastAnswerId() != SCHEMAS.MSG_ANS_APPROVAL_DATA) {
            throw "Failed to retrieve approval data from operator";
        }

        return answer.data;
    }

    /**
     * Sends the signature of the approval data identified by object.anchorRequestId to the operator at object.serverUrl.
     * Returns the answer to be sent to the client, which consists of { vbHash, mbHash, height }.
     */
    async sendApprovalSignature(privateKey: any, object: any, signature: any) {
        let answer = await network.sendWalletToOperatorMessage(
            object.serverUrl,
            SCHEMAS.MSG_APPROVAL_SIGNATURE,
            {
                anchorRequestId: object.anchorRequestId,
                signature: signature
            }
        );

        let answerObject = {
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            vbHash: answer.vbHash,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            mbHash: answer.mbHash,
            // @ts-expect-error TS(2571): Object is of type 'unknown'.
            height: answer.height
        };

        return {
            walletObject: answerObject,
            clientAnswer: this.formatAnswer(
                SCHEMAS.WIRQ_DATA_APPROVAL,
                answerObject
            )
        }
    }
}
