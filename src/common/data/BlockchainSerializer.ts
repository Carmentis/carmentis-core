import {decode, encode} from 'cbor-x';
import {MicroblockHeader, MicroblockHeaderSchema} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import * as v from 'valibot';

export class BlockchainSerializer {
    static serializeMicroblockSerializedHeaderAndBody(serializedHeader: Uint8Array, serializedBody: Uint8Array): Uint8Array {
        return encode({
            serializedHeader,
            serializedBody
        })
    }

    static unserializeMicroblockSerializedHeaderAndBody(serializedMicroblockSerializedHeaderAndBody: Uint8Array) {
        // TODO: use a specific object or do better
        return decode(
            serializedMicroblockSerializedHeaderAndBody
        ) as { serializedHeader: Uint8Array, serializedBody: Uint8Array }
    }

    static serializeMicroblockHeader(header: MicroblockHeader): Uint8Array {
        return encode(v.parse(MicroblockHeaderSchema,header));
    }

    static unserializeMicroblockHeader(serializedHeader: Uint8Array): MicroblockHeader {
        const decoded = decode(serializedHeader);
        return v.parse(MicroblockHeaderSchema, decoded);
    }
}