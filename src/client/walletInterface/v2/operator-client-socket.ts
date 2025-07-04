import {io, Socket} from "socket.io-client";
import {EncoderFactory} from "../../../common/utils/encoder";
import {MessageSerializer, MessageUnserializer} from "../../../common/data/messageSerializer";
import { SCHEMAS } from "../../../common/constants/constants";
import * as qrCode from "../../qrCode/qrCode";
import {SchemaSerializer, SchemaUnserializer} from "../../../common/data/schemaSerializer";

export class ClientObserver {
    constructor(
        private qrCodeElement: HTMLElement,
    ) {}

    updateQrCode(qrId: string, timestamp: number, operatorEndpoint: string) {
        let qr = qrCode.create(qrId, timestamp, operatorEndpoint);
        this.qrCodeElement.setAttribute("qrData", qr.data);
        this.qrCodeElement.innerHTML = qr.imageTag;
    }
}

export class CarmentisWebExtensionCaller {

    constructor(private openCarmentisExtensionButton: HTMLElement) {

    }


    sendRequestToExtension(type: number, request: Uint8Array) {
        // @ts-expect-error TS(2339): Property 'carmentisWallet' does not exist on type ... Remove this comment to see the full error message
        if(window.carmentisWallet == undefined) {
            console.warn("The Carmentis extension is not installed.");
            return;
        }
        /*
        _this.messageCallback = (event: any) => {
            console.log("[wiClient] received answer:", event);

            if(event.data.from == "carmentis/walletResponse") {

                let object = event.data.data,
                    schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]),
                    //binary = base64.decodeBinary(object.answer, base64.BASE64),
                    binary = _this.encoder.decode(object.answer),
                    answerObject = schemaSerializer.unserialize(binary);

                resolve(answerObject as T);
            }
        };

         */

        const encoder = EncoderFactory.defaultBytesToStringEncoder();
        let message = {
            requestType: type,
            request: encoder.encode(request)
            //request: base64.encodeBinary(request, base64.BASE64)
        };

        // @ts-expect-error TS(2339): Property 'carmentisWallet' does not exist on type ... Remove this comment to see the full error message
        window.carmentisWallet.openPopup(message);
    }

}

export abstract class OperatorClientSocket<T> {
    private operatorEndpoint: string;
    private socket: Socket;
    private encoder = EncoderFactory.defaultBytesToStringEncoder();
    private observers: ClientObserver[] = [];

    constructor(operatorEndpoint: string) {
        this.operatorEndpoint = operatorEndpoint;
        this.socket = io(this.operatorEndpoint);
        this.socket.on('connect', this.onConnect)
        this.socket.on('disconnect', this.onDisconnect)
        this.socket.on('connect_error', this.onConnectError)
    }

    addObserver(observer: ClientObserver) {
        this.observers.push(observer);
    }


    protected onConnect() {}
    protected onDisconnect() {}
    protected onConnectError() {}

    private decodeRequest(message: any) {
        const schemaSerializer = new MessageUnserializer(SCHEMAS.WI_MESSAGES);
        const binary = this.encoder.decode(message)
        return schemaSerializer.unserialize(binary);
    }

    private encodeRequest(type: number, object: any) {
        const schemaSerializer = new SchemaSerializer(SCHEMAS.WI_REQUESTS[type]);
        let request = schemaSerializer.serialize(object);

        let reqObject = {
            requestType: type,
            request    : request,
            deviceId   : new Uint8Array(32),
            withToken  : 0
        };

        const messageSerializer = new MessageSerializer(SCHEMAS.WI_MESSAGES);
        const binary = messageSerializer.serialize(type, reqObject);
        return this.encoder.encode(binary);
    }

    protected sendMessage(msgId: any, object = {}): Promise<T> {
        return new Promise((resolve, reject) => {
            this.socket.emit("data", this.encodeRequest(msgId, object));
            this.socket.on("data", (data: any) => {
                const {type, object} = this.decodeRequest(data);
                switch(type) {
                    case SCHEMAS.WIMSG_UPDATE_QR:
                        // @ts-ignore
                        this.observers.forEach(o => o.updateQrCode(object.qrId, object.timestamp, this.operatorEndpoint));
                        break

                    case SCHEMAS.WIMSG_FORWARDED_ANSWER: {
                        // @ts-ignore
                        const schemaSerializer = new SchemaUnserializer(SCHEMAS.WI_ANSWERS[object.answerType]);
                        // @ts-ignore
                        let answerObject = schemaSerializer.unserialize(object.answer);

                        resolve(answerObject as T);
                        break;
                    }

                    default: console.warn("Unknown message type " + type);
                }
            });
        })
    }
}

export class AuthenticationByPublicKeySocket extends OperatorClientSocket<{challenge: string, signature: string, publicKey: string}> {
    constructor(operatorEndpoint: string) {
        super(operatorEndpoint);
    }

    async authenticate(challenge: string) {
        const encoder = EncoderFactory.defaultBytesToStringEncoder();
        return this.sendMessage( SCHEMAS.WIRQ_AUTH_BY_PUBLIC_KEY, { challenge: encoder.decode(challenge) });
    }
}


