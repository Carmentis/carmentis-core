import {SCHEMAS} from "../constants/constants";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {EncoderFactory} from "../utils/encoder";
import axios from "axios";

let networkInterface: any,
    lastAnswerId: any;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(intf: any) {
    networkInterface = intf;
}

// ============================================================================================================================ //
//  getLastAnswerId()                                                                                                           //
// ============================================================================================================================ //
export function getLastAnswerId() {
    return lastAnswerId;
}

// ============================================================================================================================ //
//  sendMessageToNode()                                                                                                         //
// ============================================================================================================================ //
export async function sendMessageToNode(url: any, schemaId: any, object: any) {
    return await sendMessage(url, schemaId, object, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  sendWalletToOperatorMessage()                                                                                               //
// ============================================================================================================================ //
export async function sendWalletToOperatorMessage<T = unknown>(url: any, schemaId: any, object: any) {
    return await sendMessage(url.replace(/\/?$/, "/api/walletMessage"), schemaId, object, SCHEMAS.WALLET_OP_MESSAGES) as T;
}

// ============================================================================================================================ //
//  sendMessage()                                                                                                               //
// ============================================================================================================================ //
async function sendMessage(url: any, schemaId: any, object: any, schema: any) {
    // encode the payload
    const encoder = EncoderFactory.defaultBytesToStringEncoder();
    const serializer = new MessageSerializer(schema)
    let data = serializer.serialize(schemaId, object),
        b64 = encoder.encode(data);

    return new Promise(async (resolve, reject) => {
        try {

            // send the request to the provided url
            const response = await axios.post(url, { data: b64 }, {
                headers: {
                    "Content-Type": "application/json",
                    "Accept": "application/json",
                }
            });

            // parse the response

            const responseObject: { success: boolean, data: string } = response.data;

            // TODO: remove if not correct
            if (!responseObject.success) {
                resolve(responseObject)
                return
            }


            let binary = encoder.decode(responseObject.data);
            const serializer = new MessageUnserializer(schema)
            let { type, object } = serializer.unserialize(binary);
            console.debug("Receiving object from operator:", object);

            // update the response
            lastAnswerId = type;

            if(type == SCHEMAS.MSG_ANS_ERROR) {
                // @ts-expect-error TS(2556): A spread argument must either have a tuple type or... Remove this comment to see the full error message
                let error = new Error(object.error.type, object.error.id, ...object.error.arg);
                reject(error);
            } else {
                resolve(object);
            }


        } catch (error) {
            if (axios.isAxiosError(error)) {
                console.error('Erreur Axios :', error.response?.status, error.response?.data);
            } else {
                // @ts-ignore
                console.error('Error :', error, error.stack);
            }
            reject(error);
        }
    })
}
