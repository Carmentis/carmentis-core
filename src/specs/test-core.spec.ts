import {describe, expect, test} from '@jest/globals';
import {KeyedProvider} from "../common/providers/keyed-provider";
import {MemoryProvider} from "../common/providers/memoryProvider";
import {ServerNetworkProvider} from "../common/providers/serverNetworkProvider";
import {Blockchain} from "../common/blockchain/blockchain";
import {start} from "../common/dev-node/dev-node";
import {IntermediateRepresentation} from "../common/records/intermediateRepresentation";
import {Utils} from "../common/utils/utils";
import {SchemaSerializer, SchemaUnserializer} from "../common/data/schemaSerializer";
import {ReadStream, WriteStream} from "../common/data/byteStreams";
import {RadixTree} from "../common/trees/radixTree";
import {DATA} from '../common/constants/constants.js';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";

describe('testNumbers', () => {
    test('should serialize and deserialize numbers correctly', () => {
        console.log("Testing numbers");

        [
            0, 1, -1, 63, -64, 64, -65, 255, 256, -255, -256, 65535, -65536, 12345,
            0x123456789ABC, 0xFFFFFFFFFFFF, -0x1000000000000,
            2e8, 2e10, 2e38, 2e39, 1.234, 1/4*1e-10, 1.234567, 1.2345678, 1/7, 1/7*1e-25,
            2**48-1, 2**48, -(2**48),
            Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER
        ]
            .forEach((n) => {
                let stream = new WriteStream();

                stream.writeNumber(+n);

                const data = stream.getByteStream();

                //stream = new ReadStream(data);

                /*
                const res = stream.readNumber();

                console.log(
                    n.toString().padEnd(22),
                    [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
                    res === n ? "OK" : `FAILED (${res})`
                );

                 */
            });
        console.log();
    });
});

describe('testUnsignedIntegers', () => {
    test('should serialize and deserialize unsigned integers correctly', () => {
        console.log("Testing unsigned integers");

        [ 0, 1, 127, 128, 255, 256, 16383, 16384, 123456, Number.MAX_SAFE_INTEGER ]
            .forEach((n) => {
                let stream = new WriteStream();

                stream.writeVarUint(n);

                const data = stream.getByteStream();

                //stream = new ReadStream(data);

                console.log(
                    n.toString().padEnd(22),
                    [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
                    //stream.readVarUint() === n ? "OK" : "FAILED"
                );
            });
        console.log();
    });
});

describe('testStrings', () => {
    test('should serialize and deserialize strings correctly', () => {
        console.log("Testing strings");

        [
            "",
            "\0",
            "Hello world",
            "100€",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        ]
            .forEach(str => {
                let stream = new WriteStream();

                stream.writeString(str);

                const data = stream.getByteStream();

                //stream = new ReadStream(data);

                console.log(
                    JSON.stringify(str),
                    `(${str.length})`,
                    [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join(""),
                    //stream.readString() === str ? "OK" : "FAILED"
                );
            });
        console.log();
    });
});

describe('testSchemaSerializer', () => {
    test('should serialize and unserialize schema objects', () => {
        const SCHEMA = [
            { name: "foo", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8, size: 2 },
            { name: "bar", type: DATA.TYPE_OBJECT, schema: [ { name: "p0", type: DATA.TYPE_STRING }, { name: "p1", type: DATA.TYPE_BOOLEAN } ] }
        ];

        const object = { foo: [ 123, 255 ], bar: { p0: "hello", p1: true } };

        const serializer = new SchemaSerializer(SCHEMA),
            unserializer = new SchemaUnserializer(SCHEMA);

        const data = serializer.serialize(object);

        console.log("data", data);
        console.log(unserializer.unserialize(data));
    });
});

describe('testRadixTree', () => {
    test('should work with RadixTree (WIP)', async () => {
        const tree = new RadixTree();
    });
});
