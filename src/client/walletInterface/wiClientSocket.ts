import {SCHEMAS} from "../../common/constants/constants";
import {EncoderFactory} from "../../common/utils/encoder";
import {MessageSerializer, MessageUnserializer} from "../../common/data/messageSerializer";
import {ClientBridgeMessage} from "../../common/type/valibot/clientBridge/clientBridgeMessages";
import {ClientBridgeEncoder} from "../../common/type/valibot/clientBridge/ClientBridgeEncoder";
//import * as base64 from "../../common/util/base64";
//import * as schemaSerializer from "../../common/serializers/schema-serializer";

let io: any;

// ============================================================================================================================ //
//  setIo()                                                                                                                     //
// ============================================================================================================================ //
export function setIo(module: any) {
    io = module;
}

// ============================================================================================================================ //
//  getSocket()                                                                                                                 //
// ============================================================================================================================ //
export function getSocket(endpoint: string, connectCallback: any, dataCallback: (message: ClientBridgeMessage) => void | Promise<void> ) {
    let socket = io(endpoint);
    console.log("Get socket:", socket);
    socket.on("connect", () => {
        if(!socket.connectionInitiated) {
            socket.connectionInitiated = true;
            connectCallback(socket);
        }
    });

    socket.on("connect_error", (err: any) => console.error(err));

    socket.on("data", onData);
    socket.on("connect_error", (err: any) => console.error("Connection error", err));

    const encoder = EncoderFactory.bytesToBase64Encoder();
    socket.sendMessage = async function(message: ClientBridgeMessage) {
        console.log("sending message", message);
        const binary = ClientBridgeEncoder.encode(message);
        const data = encoder.encode(binary);
        socket.emit("data", data);
    }

    function onData(base64EncodedMessage: string) {
        console.log(`receiving message: ${base64EncodedMessage}`, base64EncodedMessage)
        const binary = encoder.decode(base64EncodedMessage)
        const message = ClientBridgeEncoder.decode(binary);
        dataCallback(message);
    }

    return socket;
}
