import {describe, test} from '@jest/globals';
import {IntermediateRepresentation} from "../common/records/intermediateRepresentation";

const NODE_URL = "http://localhost:26657";

describe('Chain test', () => {
    test('testIr()', async () => {
        let ir, testObject, sectionData;

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
        ir.finalizeChannelData();

        sectionData = ir.exportToSectionFormat();
        console.log("sectionData", sectionData);

        ir.setAsRedacted("this.someObject.someNumberArrayProp[*]");

        const proof1 = ir.exportToProof();
        console.log("proof 1", JSON.stringify(proof1, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof1));
        ir.setAsMasked("this.email");
        const proof2 = ir.exportToProof();
        console.log("proof 2", JSON.stringify(proof2, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof2));
        ir.setAsRedacted("this.email");
        ir.setAsRedacted("this.someObject.someStringProp");
        const proof3 = ir.exportToProof();
        console.log("proof 3", JSON.stringify(proof3, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof3));

        console.log("exportToJson", JSON.stringify(ir.exportToJson(), null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);

        ir.importFromSectionFormat(sectionData);
        console.log("recovered from sections", JSON.stringify(ir.exportToJson(), null, 2));
    })
});
