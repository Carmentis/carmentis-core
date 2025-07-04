import * as fs from "fs";
import { IntermediateRepresentation } from "./records/intermediateRepresentation";
import { Utils } from "./utils/utils";

const content = fs.readFileSync("./test-data/test1-small.json", "utf8");
const testObject = JSON.parse(content);

const ir = new IntermediateRepresentation;

ir.buildFromJson(testObject);
ir.setChannel("this[*]", 0);
ir.serializeFields();
ir.populateChannels();

const sectionData = ir.exportToSectionFormat();

console.log(`Section binary data: ${sectionData.length} bytes`);

ir.setAsRedacted("this[0].*");
//ir.setAsRedacted("this[1].*");
//ir.setAsRedacted("this[2].*");

const proof = ir.exportToProof();
const proofAsText = JSON.stringify(proof, null, 2);

console.log(`Formatted proof: ${proofAsText.length} bytes`);

fs.writeFileSync("./proofs/proof1.json", proofAsText);
