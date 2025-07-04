import { SCHEMAS } from "../../common/constants/constants";
import {EncoderFactory} from "../../common/utils/encoder";
import {SchemaSerializer} from "../../common/data/schemaSerializer";
import {MessageSerializer, MessageUnserializer} from "../../common/data/messageSerializer";
import {getCombinedBaseUrl} from "barrelsby/bin/options/baseUrl";
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
export function getSocket(endpoint: any, connectCallback: any, dataCallback: any) {
    let socket = io(endpoint);
    console.log(socket);
    socket.on("connect", () => {
        if(!socket.connectionInitiated) {
            socket.connectionInitiated = true;
            connectCallback(socket);
        }
    });

    socket.on("connect_error", (err: any) => console.error(err));

    socket.on("data", onData);
    socket.on("connect_error", (err: any) => console.error("Connection error", err));

    const encoder = EncoderFactory.defaultBytesToStringEncoder();
    socket.sendMessage = async function(msgId: any, object = {}) {
        const schemaSerializer = new MessageSerializer(SCHEMAS.WI_MESSAGES);
        const binary = schemaSerializer.serialize(msgId, object);
        const data = encoder.encode(binary);
        socket.emit("data", data);
    }

    function onData(message: string) {
        const schemaSerializer = new MessageUnserializer(SCHEMAS.WI_MESSAGES);
        const binary = encoder.decode(message)
        const {type, object} = schemaSerializer.unserialize(binary);
        dataCallback(type, object);
    }

    return socket;
}
