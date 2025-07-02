import * as SCHEMAS from "../../common/constants/schemas";
import {SchemaUnserializer} from "../../common/data/schemaSerializer";
import * as network from "../../common/network/network";
import {PrivateSignatureKey} from "../../common/crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../../common/crypto/signature/signature-encoder";
import {CryptoSchemeFactory} from "../../common/crypto/factory";
import {EncoderFactory} from "../../common/utils/encoder";

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
    signAuthenticationByPublicKey(privateKey: PrivateSignatureKey, object: any) {
        /*
        let publicKey = crypto.secp256k1.publicKeyFromPrivateKey(privateKey),
            signature = crypto.secp256k1.sign(privateKey, object.challenge);
         */
        const challenge = object.challenge;
        const signature = privateKey.sign(challenge);
        const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();

        let answerObject = {
            publicKey: signatureEncoder.encodePublicKey(privateKey.getPublicKey()),
            signature: signatureEncoder.encodeSignature(signature),
        };

        return this.formatAnswer(
            SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
            answerObject
        );
    }



    /**
     * Gets the approval data identified by object.dataId, from the operator at object.serverUrl.*
     *
     * @param {PrivateSignatureKey} privateKey
     * @param object
     * @returns {Promise<*>}
     */
    async getApprovalData(privateKey: PrivateSignatureKey, walletSeed: Uint8Array, object: { serverUrl: string, dataId: string }) {

        // send an initial message approval handshake containing the dataId provided by the web client.
        let answer = await network.sendWalletToOperatorMessage<{ genesisSeed?: string, data: Uint8Array }>(
            object.serverUrl,
            SCHEMAS.MSG_APPROVAL_HANDSHAKE,
            {
                dataId: object.dataId
            }
        );

        // In case where the actor public key is required for this interaction, the user provides a derived key
        if(network.getLastAnswerId() == SCHEMAS.MSG_ANS_ACTOR_KEY_REQUIRED) {
            // asserts that the genesisSeed is provided by the operator
            const genesisSeed = answer.genesisSeed;
            if (typeof genesisSeed !== 'string') throw 'Invalid genesisSeed provided, expected string, got: ' + typeof genesisSeed;

            // derive the actor key from the private key and the genesis seed
            const cryptoFactory = new CryptoSchemeFactory();
            const algorithmId = privateKey.getSignatureAlgorithmId();
            const encoder = EncoderFactory.defaultBytesToStringEncoder();
            const actorPrivateKey = cryptoFactory.createVirtualBlockchainPrivateSignatureScheme(
                algorithmId,
                walletSeed,
                encoder.decode(genesisSeed)
            );
            const actorPublicKey = actorPrivateKey.getPublicKey();

            // send the actor key to the operator and awaits for the response
            const signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
            answer = await network.sendWalletToOperatorMessage<{data: Uint8Array}>(
                object.serverUrl,
                SCHEMAS.MSG_ACTOR_KEY,
                {
                    dataId: object.dataId,
                    actorKey: signatureEncoder.encodePublicKey(actorPublicKey)
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
     * Sends the signature of the approval data identified by object.dataId to the operator at object.serverUrl.
     * Returns the answer to be sent to the client, which consists of { vbHash, mbHash, height }.
     */
    async sendApprovalSignature(privateKey: any, object: any, signature: any) {
        let answer = await network.sendWalletToOperatorMessage(
            object.serverUrl,
            SCHEMAS.MSG_APPROVAL_SIGNATURE,
            {
                dataId: object.dataId,
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
