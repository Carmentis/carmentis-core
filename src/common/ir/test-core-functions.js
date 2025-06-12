import { WriteStream, ReadStream } from "./serializers/byteStreams.js";
import { IntermediateRepresentation } from "./records/intermediateRepresentation.js";
import { SchemaSerializer, SchemaUnserializer } from "./serializers/schemaSerializer.js";
import { Blockchain } from "./blockchain/blockchain.js";
import { MemoryProvider } from "./providers/memoryProvider.js";
import { Crypto } from "./crypto/crypto.js";
import { Utils } from "./utils/utils.js";
import { DATA } from "./constants/constants.js";

(async function() {
  testNumbers();
  testUnsignedIntegers();
  testStrings();
//await testChain();
  testIR();
//testSchemaSerializer();
//await testLedger();
})();

function testNumbers() {
  console.log("Testing numbers");

  [
    0, 1, -1, 63, -64, 64, -65, 255, 256, -255, -256, 65535, -65536, 12345,
    0x123456789ABC, 0xFFFFFFFFFFFF, -0x1000000000000,
    2e8, 2e10, 2e38, 2e39, 1.234, 1/4*1e-10, 1.234567, 1.2345678, 1/7, 1/7*1e-25,
    2**48-1, 2**48, -(2**48),
    Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER
  ]
  .forEach(n => {
    let stream = new WriteStream();

    stream.writeNumber(+n);

    const data = stream.getByteStream();

    stream = new ReadStream(data);

    const res = stream.readNumber();

    console.log(
      n.toString().padEnd(22),
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
      res === n ? "OK" : `FAILED (${res})`
    );
  });
  console.log();
}

function testUnsignedIntegers() {
  console.log("Testing unsigned integers");

  [ 0, 1, 127, 128, 255, 256, 16383, 16384, 123456, Number.MAX_SAFE_INTEGER ]
  .forEach(n => {
    let stream = new WriteStream();

    stream.writeVarUint(n);

    const data = stream.getByteStream();

    stream = new ReadStream(data);

    console.log(
      n.toString().padEnd(22),
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
      stream.readVarUint() === n ? "OK" : "FAILED"
    );
  });
  console.log();
}

function testStrings() {
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

    stream = new ReadStream(data);

    console.log(
      JSON.stringify(str),
      `(${str.length})`,
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join(""),
      stream.readString() === str ? "OK" : "FAILED"
    );
  });
  console.log();
}

async function testChain() {
  //const keyPair = Crypto.MLDsa.generateKeyPair();

  const privateKey = Crypto.Random.getKey256(),
        publicKey = Crypto.Secp256k1.publicKeyFromPrivateKey(privateKey),
        keyPair = { publicKey, privateKey };

  const blockchain = new Blockchain({
    internalProvider: MemoryProvider,
    externalProvider: MemoryProvider
  });

  let hash;

  let account = await blockchain.createGenesisAccount(keyPair);

  hash = await account.publishUpdates();

  account = await blockchain.loadAccount(hash, keyPair);

  let organization = await blockchain.createOrganization(keyPair);

  await organization.setDescription({
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "FR",
    website: "www.carmentis.io"
  });

  hash = await organization.publishUpdates();

  organization = await blockchain.loadOrganization(hash, keyPair);
}

function testIR() {
  let ir, testObject, data0, data1;

  testObject =
    {
      someString: "Hello, world!",
      email: "john.doe@gmail.com",
      someObject: {
        someStringProp: "As we travel the universe 🪐",
        someNumberArrayProp: [ 123, 456, 78.9 ],
        someObjectArrayProp: [ { name: "a" }, { name: "b" }, { name: "c" } ],
        someNullProp: null,
        someBooleanProp: true
      }
    };

  ir = new IntermediateRepresentation;
  ir.addPrivateChannel(0);
  ir.addPrivateChannel(1);

  ir.buildFromJson(testObject);
  ir.setChannel("this.*", 0);
  ir.setChannel("this.someObject.someStringProp, this.someObject.someNullProp", 1);
  ir.setAsMaskableByRegex("this.email", /^(.)(.*?)(@.)(.*?)(\..*)$/, "$1***$3***$5");
  ir.serializeFields();
  ir.populateChannels();

  data0 = ir.exportToSectionFormat(0, true);
  console.log("data0", data0);
  console.log(ir.getMerkleRootHash(0));
  data1 = ir.exportToSectionFormat(1, true);
  console.log("data1", data1);
  console.log(ir.getMerkleRootHash(1));

  ir.setAsRedacted("this.someObject.someNumberArrayProp[*]");

  const info = {
    microblock: Utils.binaryToHexa(new Uint8Array(32)),
    author: "Arnauld Chevallier"
  };

  const proof1 = ir.exportToProof(info);
  console.log("proof 1", JSON.stringify(proof1, null, 2));

  ir = new IntermediateRepresentation;
  ir.addPrivateChannel(0);
  ir.addPrivateChannel(1);
  console.log(ir.importFromProof(proof1));
  ir.setAsMasked("this.email");
  const proof2 = ir.exportToProof(info);
  console.log("proof 2", JSON.stringify(proof2, null, 2));

  ir = new IntermediateRepresentation;
  ir.addPrivateChannel(0);
  ir.addPrivateChannel(1);
  console.log(ir.importFromProof(proof2));
  ir.setAsRedacted("this.email");
  ir.setAsRedacted("this.someObject.someStringProp");
  const proof3 = ir.exportToProof(info);
  console.log("proof 3", JSON.stringify(proof3, null, 2));

  ir = new IntermediateRepresentation;
  ir.addPrivateChannel(0);
  ir.addPrivateChannel(1);
  console.log(ir.importFromProof(proof3));

  console.log("exportToJson", JSON.stringify(ir.exportToJson(), null, 2));

  ir = new IntermediateRepresentation;
  ir.addPrivateChannel(0);
  ir.addPrivateChannel(1);

  ir.importFromSectionFormat(0, data0);
  ir.importFromSectionFormat(1, data1);
  console.log("recovered from sections", JSON.stringify(ir.exportToJson(), null, 2));
/*
//ir.merklize(0);
//ir.merklize(1);

  ir = new IntermediateRepresentation;

  ir.importFromSectionFormat(0, data0);
  ir.importFromSectionFormat(1, data1);
  console.log("recovered object", ir.dumpIRObject());

  testObject =
    [
      "hello",
      123
    ];

  ir = new IntermediateRepresentation;
  ir.buildFromJson(testObject);
  ir.setChannel("this[*]", 0);
  ir.setChannel("this[0]", 1);
  ir.serializeFields();
  ir.populateChannels();

  data0 = ir.exportToSectionFormat(0);
  console.log("data0", data0);
  data1 = ir.exportToSectionFormat(1);
  console.log("data1", data1);

  ir.merklize(0);
  ir.merklize(1);

  console.log(ir.dumpIRObject());

  ir = new IntermediateRepresentation;

  ir.importFromSectionFormat(0, data0);
  ir.importFromSectionFormat(1, data1);
  console.log("recovered object", ir.dumpIRObject());
*/
}

function testSchemaSerializer() {
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
}

async function testLedger() {
  const ledger = new AppLedger;

  const msg = await ledger.encodeMessage(
    "This is a test message referencing a field: {{this.someObject.someStringProp}}."
  );

  console.log("message", msg);
  console.log(await ledger.decodeMessage(msg));
}
