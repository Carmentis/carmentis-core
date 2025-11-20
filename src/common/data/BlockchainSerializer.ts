import {MicroblockHeaderObject} from "../type/types";
import {SchemaSerializer, SchemaUnserializer} from "./schemaSerializer";
import {SCHEMAS} from "../constants/constants";
import {decode, encode} from 'cbor2';

export class BlockchainSerializer {
    static serializeMicroblockSerializedHeaderAndBody(serializedHeader: Uint8Array, serializedBody: Uint8Array): Uint8Array {
        return encode({
            serializedHeader,
            serializedBody
        })
    }

    static unserializeMicroblockSerializedHeaderAndBody(serializedMicroblockSerializedHeaderAndBody: Uint8Array) {
        return decode<{ serializedHeader: Uint8Array, serializedBody: Uint8Array }>(
            serializedMicroblockSerializedHeaderAndBody
        )
    }

    static serializeMicroblockHeader(header: MicroblockHeaderObject): Uint8Array {
        const unserializer = new SchemaSerializer<MicroblockHeaderObject>(SCHEMAS.MICROBLOCK_HEADER);
        const object = unserializer.serialize(header);
        return object;
    }

    static unserializeMicroblockHeader(serializedHeader: Uint8Array) {
        const unserializer = new SchemaUnserializer<MicroblockHeaderObject>(SCHEMAS.MICROBLOCK_HEADER);
        const object = unserializer.unserialize(serializedHeader);
        return object;
    }
}