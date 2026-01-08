import * as SCHEMAS from "../../common/constants/schemas";
import {SchemaUnserializer} from "../../common/data/schemaSerializer";
import * as network from "../../common/network/network";
import {AccountCrypto} from "../../common/wallet/AccountCrypto";
import {HCVPkeEncoder} from "../../common/crypto/encryption/public-key-encryption/HCVPkeEncoder";
import {
    PublicKeyEncryptionSchemeId
} from "../../common/crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {PrivateSignatureKey} from "../../common/crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../../common/crypto/signature/SignatureSchemeId";
import {CryptoEncoderFactory} from "../../common/crypto/encoder/CryptoEncoderFactory";
import {
    WalletRequestAuthByPublicKey,
    WalletResponseAuthByPublicKey, WalletResponseDataApproval, WalletResponseType
} from "../../common/type/valibot/walletRequest/walletRequests";
import {
    WalletInteractiveAnchoringRequest,
    WalletInteractiveAnchoringRequestApprovalHandshake, WalletInteractiveAnchoringRequestApprovalSignature,
    WalletInteractiveAnchoringRequestType, WalletInteractiveAnchoringResponse, WalletInteractiveAnchoringResponseType
} from "../../common/zod/walletOperatorMessages/Schemas";
import {EncoderFactory} from "../../common/utils/encoder";
import {WalletInteractiveAnchoringEncoder} from "../../common/utils/WalletInteractiveAnchoringEncoder";
import axios from "axios";

export abstract class wiWallet<T> {

    constructor() {
    }

    /*
    decodeRequest(requestType: any, request: any) {
        const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_REQUESTS[requestType])
        let requestObject = schemaSerializer.unserialize(request);

        let req = {
            type: requestType,
            object: requestObject
        };

        return req;
    }

     */

    //abstract formatAnswer(answerType: number, object: any): {answerType: number, answer: T};

    /**
     * Signs a request of authentication by public key. Returns the answer in the format expected by the application front.
     *
     * @param {PrivateSignatureKey} privateKey
     * @param object
     * @returns {*}
     */
    async signAuthenticationByPublicKey(privateKey: PrivateSignatureKey, object: WalletRequestAuthByPublicKey): Promise<WalletResponseAuthByPublicKey> {
        const b64Encoder = EncoderFactory.bytesToBase64Encoder();
        const challenge = b64Encoder.decode(object.base64EncodedChallenge);
        const signature = await privateKey.sign(challenge);
        const signatureEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();

        const response: WalletResponseAuthByPublicKey = {
            type: WalletResponseType.AUTH_BY_PUBLIC_KEY,
            publicKey: await signatureEncoder.encodePublicKey(await privateKey.getPublicKey()),
            signature: signatureEncoder.encodeSignature(signature),
        };
        return response;
        /*
        return this.formatAnswer(
            SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY,
            answerObject
        );

         */
    }


    private async sendRequestToOperator(serverUrl: string, request: WalletInteractiveAnchoringRequest): Promise<WalletInteractiveAnchoringResponse> {
        const endpoint = `${serverUrl}/api/protocols/wiap/v1`
        console.log(`Sending request to operator at ${endpoint}: `, request)

        // encode the payload
        const serializedRequest = WalletInteractiveAnchoringEncoder.encodeRequest(request);
        const encoder = EncoderFactory.defaultBytesToStringEncoder();
        const b64 = encoder.encode(serializedRequest);

        try {

            // send the request to the provided url

            const response = await axios.post(endpoint, { data: b64 }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
            });

            // parse the response
            const base64EncodedResponse: string = response.data;
            const serializedRespnse = encoder.decode(base64EncodedResponse);
            const responseObject = WalletInteractiveAnchoringEncoder.decodeResponse(serializedRespnse);
            console.log("Received response from operator: ", responseObject)
            return responseObject;


            // TODO: remove if not correct
            /*
            if (!responseObject.success) {
                resolve(responseObject)
                return
            }

             */

            /*
            let binary = encoder.decode(responseObject.data);
            const serializer = new MessageUnserializer(schema)
            let { type, object } = serializer.unserialize(binary);
            console.debug("Receiving object from operator:", object);
             */

            // update the response
            //lastAnswerId = type;

            /*
            if (type == SCHEMAS.MSG_ANS_ERROR) {
                // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
                let error = new Error(object.error.type, object.error.id, ...object.error.arg);
                reject(error);
            } else {
                resolve(object);
            }

             */


        } catch (error) {
            let errorMessage = "Unspecified error occurred while communicating with the operator"
            if (axios.isAxiosError(error)) {
                console.error('Erreur Axios :', error.response?.status, error.response?.data);
                errorMessage = error.message;
            } else if (error instanceof Error) {
                console.error('Error :', error, error.stack);
                errorMessage = error.stack || error.message;
            }
            return {
                type: WalletInteractiveAnchoringResponseType.ERROR,
                errorMessage,
            }
        }
    }


    /**
     * Gets the approval data identified by object.anchorRequestId, from the operator at object.serverUrl.*
     *
     * @returns {Promise<*>}
     */
    async getApprovalData(accountCrypto: AccountCrypto, object: { serverUrl: string, anchorRequestId: string }) {
        // send an initial message approval handshake containing the anchorRequestId provided by the web client.
        const anchorRequestId = object.anchorRequestId;
        const handshakeRequest: WalletInteractiveAnchoringRequestApprovalHandshake = {
            type: WalletInteractiveAnchoringRequestType.APPROVAL_HANDSHAKE,
            anchorRequestId,
        }
        const handshakeResponse = await this.sendRequestToOperator(object.serverUrl, handshakeRequest);
        console.log("Received getApprovalData answer: ")



        // In case where the actor public key is required for this interaction, the user provides a derived key
        if (handshakeResponse.type == WalletInteractiveAnchoringResponseType.ACTOR_KEY_REQUIRED) {
            console.debug("Operator asking for actor key: proceeding to the actor key generation")

            // asserts that the genesisSeed is provided by the operator
            const genesisSeed = handshakeResponse.genesisSeed;
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
            const signatureEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
            const pkeEncoder = HCVPkeEncoder.createBase64HCVPkeEncoder();
            const actorKeyResponse = await this.sendRequestToOperator(object.serverUrl, {
                type: WalletInteractiveAnchoringRequestType.ACTOR_KEY,
                anchorRequestId: object.anchorRequestId,
                actorSignaturePublicKey: await signatureEncoder.encodePublicKey(actorSignaturePublicKey),
                actorPkePublicKey: await pkeEncoder.encodePublicEncryptionKey(actorPublicEncryptionKey)
            })

            if (actorKeyResponse.type === WalletInteractiveAnchoringResponseType.APPROVAL_DATA) {
                return actorKeyResponse;
            } else if (actorKeyResponse.type === WalletInteractiveAnchoringResponseType.ERROR) {
                throw new Error(actorKeyResponse.errorMessage);
            } else {
                throw new Error(`Unexpected response type: ${actorKeyResponse.type}`);
            }
        } else if (handshakeResponse.type == WalletInteractiveAnchoringResponseType.APPROVAL_DATA) {
            return handshakeResponse
        } else {
            throw new Error(`Unexpected handshake response type: ${handshakeResponse.type}`);
        }
    }

    /**
     * Sends the signature of the approval data identified by object.anchorRequestId to the operator at object.serverUrl.
     * Returns the answer to be sent to the client, which consists of { vbHash, mbHash, height }.
     */
    async sendApprovalSignature(serverUrl: string, anchorRequestId: string, signature: Uint8Array) {
        const approvalSignatureRequest: WalletInteractiveAnchoringRequestApprovalSignature = {
            type: WalletInteractiveAnchoringRequestType.APPROVAL_SIGNATURE,
            anchorRequestId,
            signature: signature
        }
        const approvalSignatureResponse = await this.sendRequestToOperator(serverUrl, approvalSignatureRequest);
        if (approvalSignatureResponse.type === WalletInteractiveAnchoringResponseType.ERROR) {
            throw new Error(approvalSignatureResponse.errorMessage);
        } else if (approvalSignatureResponse.type === WalletInteractiveAnchoringResponseType.APPROVAL_SIGNATURE) {
            const walletResponse: WalletResponseDataApproval = {
                type: WalletResponseType.DATA_APPROVAL,
                vbHash: new Uint8Array(approvalSignatureResponse.vbHash),
                mbHash: new Uint8Array(approvalSignatureResponse.mbHash),
                height: approvalSignatureResponse.height
            }
            return walletResponse;
        } else {
            throw new Error(`Unexpected approval signature response type: ${approvalSignatureResponse.type}`);
        }
        /*
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

        };

        return {
            walletObject: answerObject,
            clientAnswer: this.formatAnswer(
                SCHEMAS.WIRQ_DATA_APPROVAL,
                answerObject
            )
        }

         */
    }
}
