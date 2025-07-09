import {MessageSerializer, MessageUnserializer} from "./messageSerializer";
import {MSG_ERROR, NODE_MESSAGES} from "../constants/schemas";
import {BlockchainError} from "../errors/carmentis-error";

export interface SerializerInterface<Source, Destination = Uint8Array> {
    serialize(type, source: Source): Destination;
    unserialize(destination: Destination): Source;
}

export class NodeMessageSerializer<Source> implements SerializerInterface<Source>{
    private serializer = new MessageSerializer<Source>(NODE_MESSAGES);
    private unserializer = new MessageUnserializer<Source>(NODE_MESSAGES);
    private constructor() {

    }

    static create<T = any>() {
        return new NodeMessageSerializer<T>();
    }

    serialize(typesource: Source): Uint8Array {
        return this.serializer.serialize(source);
    }

    unserialize(destination: Uint8Array): Source {
        const {type, object} = this.unserializer.unserialize(destination);
        if (type === MSG_ERROR) {
            throw new BlockchainError(object.message)
        }
    }
}