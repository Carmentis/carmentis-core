import {describe, test} from '@jest/globals';
import {SchemaSerializer, SchemaUnserializer} from "../common/data/schemaSerializer";
import {ReadStream, WriteStream} from "../common/data/byteStreams";
import {DATA} from '../common/constants/constants';

describe('testNumbers', () => {
    test('should serialize and deserialize numbers correctly', () => {
        [
            0, 1, -1, 63, -64, 64, -65, 255, 256, -255, -256, 65535, -65536, 12345,
            0x123456789ABC, 0xFFFFFFFFFFFF, -0x1000000000000,
            2e8, 2e10, 2e38, 2e39, 1.234, 1/4*1e-10, 1.234567, 1.2345678, 1/7, 1/7*1e-25,
            2**48-1, 2**48, -(2**48),
            Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER
        ]
        .forEach((n) => {
            const writeStream = new WriteStream();

            writeStream.writeNumber(+n);

            const data = writeStream.getByteStream();

            const readStream = new ReadStream(data);
            const res = readStream.readNumber();

            console.log(
                n.toString().padEnd(22),
                [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18)
            );
            if(res !== n) {
                throw `FAILED`;
            }
        });
    });
});

describe('testUnsignedIntegers', () => {
    test('should serialize and deserialize unsigned integers correctly', () => {
        [ 0, 1, 127, 128, 255, 256, 16383, 16384, 123456, Number.MAX_SAFE_INTEGER ]
        .forEach((n) => {
            const writeStream = new WriteStream();

            writeStream.writeVarUint(n);

            const data = writeStream.getByteStream();

            const readStream = new ReadStream(data);
            const res = readStream.readVarUint();

            console.log(
                n.toString().padEnd(22),
                [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18)
            );
            if(res !== n) {
                throw `FAILED`;
            }
        });
    });
});

describe('testStrings', () => {
    test('should serialize and deserialize strings correctly', () => {
        [
            "",
            "\0",
            "Hello world",
            "100€",
            "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
        ]
        .forEach(str => {
            const writeStream = new WriteStream();

            writeStream.writeString(str);

            const data = writeStream.getByteStream();

            const readStream = new ReadStream(data);
            const res = readStream.readString();

            console.log(
                JSON.stringify(str),
                `(${str.length})`,
                [...data].map((n) => n.toString(16).toUpperCase().padStart(2, "0")).join("")
            );
            if(res !== str) {
                throw `FAILED`;
            }
        });
    });
});

describe('testSchemaSerializer', () => {
    test('should serialize and unserialize schema objects', () => {
        const CHILD_SCHEMA = {
            label: "Child",
            definition: [
                { name: "int", type: DATA.TYPE_UINT48 },
                { name: "str", type: DATA.TYPE_STRING }
            ]
        };

        const SCHEMA = {
            label: "Main",
            definition: [
                { name: "array", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8, size: 2 },
                { name: "struct", type: DATA.TYPE_OBJECT, definition: [ { name: "p0", type: DATA.TYPE_STRING }, { name: "p1", type: DATA.TYPE_BOOLEAN } ] },
                { name: "child", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: CHILD_SCHEMA }
            ]
        };

        const object = {
            array: [ 123, 255 ],
            struct: { p0: "hello", p1: true },
            child: [ { int: 123456, str: "world" } ]
        };

        const serializer = new SchemaSerializer(SCHEMA);
        const unserializer = new SchemaUnserializer(SCHEMA);

        const data = serializer.serialize(object);
        const res = unserializer.unserialize(data);
        console.log(res);

        if(JSON.stringify(object) !== JSON.stringify(res)) {
            throw `FAILED`;
        }
    });
});
