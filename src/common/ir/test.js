import { writeStream, readStream } from "./byteStreams.js";
import { intermediateRepresentation } from "./intermediateRepresentation.js";
import { appLedger } from "./appLedger.js";
import * as uint8 from "../util/uint8.js";

(async function() {
  testNumbers();
  testStrings();
  testIR();
  await testLedger();
})();

function testNumbers() {
  [
    0, 1, -1, 63, -64, 64, -65, 255, 256, -255, -256, 65535, -65536, 12345,
    0x123456789ABC, 0xFFFFFFFFFFFF, -0x1000000000000,
    2e8, 2e10, 2e38, 2e39, 1.234, 1/4*1e-10, 1.234567, 1.2345678, 1/7, 1/7*1e-25,
    2**48-1, 2**48, -(2**48),
    Number.MAX_SAFE_INTEGER, Number.MIN_SAFE_INTEGER
  ]
  .forEach(n => {
    let stream = new writeStream();

    stream.writeNumber(n);

    const data = stream.getContent();

    stream = new readStream(data);

    console.log(
      n.toString().padEnd(22),
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
      stream.readNumber() === n ? "OK" : "FAILED"
    );
  });
}

function testUnsignedIntegers() {
  [ 0, 1, 127, 128, 255, 256, 16383, 16384, 123456, Number.MAX_SAFE_INTEGER ]
  .forEach(n => {
    let stream = new writeStream();

    stream.writeVarUint(n);

    const data = stream.getContent();

    stream = new readStream(data);

    console.log(
      n.toString().padEnd(22),
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join("").padEnd(18),
      stream.readVarUint() === n ? "OK" : "FAILED"
    );
  });
}

function testStrings() {
  [
    "",
    "\0",
    "Hello world",
    "100€",
    "Lorem ipsum dolor sit amet, consectetur adipiscing elit, sed do eiusmod tempor incididunt ut labore et dolore magna aliqua. Ut enim ad minim veniam, quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat. Duis aute irure dolor in reprehenderit in voluptate velit esse cillum dolore eu fugiat nulla pariatur. Excepteur sint occaecat cupidatat non proident, sunt in culpa qui officia deserunt mollit anim id est laborum."
  ]
  .forEach(str => {
    let stream = new writeStream();

    stream.writeString(str);

    const data = stream.getContent();

    stream = new readStream(data);

    console.log(
      JSON.stringify(str),
      [...data].map(n => n.toString(16).toUpperCase().padStart(2, "0")).join(""),
      stream.readString() === str ? "OK" : "FAILED"
    );
  });
}

async function testLedger() {
  const ledger = new appLedger;

  const msg = await ledger.encodeMessage(
    "This is a test message referencing a field: {{this.someObject.someStringProp}}."
  );

  console.log("message", msg);
  console.log(await ledger.decodeMessage(msg));
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

  ir = new intermediateRepresentation;

  ir.buildFromJson(testObject);
  ir.setChannel("this.*", 0);
  ir.setChannel("this.someObject.someStringProp, this.someObject.someNullProp", 1);
  ir.setAsMaskableByRegex("this.email", /^(.)(.*?)(@.)(.*?)(\..*)$/, "$1***$3***$5");
  ir.serializeFields();
  ir.populateChannels();

  data0 = ir.exportToSectionFormat(0);
  console.log("data0", data0);
  data1 = ir.exportToSectionFormat(1);
  console.log("data1", data1);

  ir.setAsRedacted("this.someObject.someNumberArrayProp[*]");

  const info = {
    microblock: uint8.toHexa(new Uint8Array(32)),
    author: "Arnauld Chevallier"
  };

  const proof1 = ir.exportToProof(info);
  console.log("proof 1", JSON.stringify(proof1, null, 2));

  ir = new intermediateRepresentation;
  ir.importFromProof(proof1);
  ir.setAsMasked("this.email");
  const proof2 = ir.exportToProof(info);
  console.log("proof 2", JSON.stringify(proof2, null, 2));

  ir = new intermediateRepresentation;
  ir.importFromProof(proof1);
  ir.setAsRedacted("this.email");
  ir.setAsRedacted("this.someObject.someStringProp");
  const proof3 = ir.exportToProof(info);
  console.log("proof 3", JSON.stringify(proof3, null, 2));

  ir = new intermediateRepresentation;
  ir.importFromProof(proof3);

//ir.merklize(0);
//ir.merklize(1);

  ir = new intermediateRepresentation;

  ir.importFromSectionFormat(0, data0);
  ir.importFromSectionFormat(1, data1);
  console.log("recovered object", ir.dumpIRObject());

  testObject =
    [
      "hello",
      123
    ];

  ir = new intermediateRepresentation;
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

  ir = new intermediateRepresentation;

  ir.importFromSectionFormat(0, data0);
  ir.importFromSectionFormat(1, data1);
  console.log("recovered object", ir.dumpIRObject());
}
