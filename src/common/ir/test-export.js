import * as fs from "fs";
import { intermediateRepresentation } from "./intermediateRepresentation.js";
import * as uint8 from "../util/uint8.js";

const content = fs.readFileSync("./test-data/test1-small.json");
const testObject = JSON.parse(content);

const ir = new intermediateRepresentation;

ir.buildFromJson(testObject);
ir.setChannel("this[*]", 0);
ir.serializeFields();
ir.populateChannels();

const sectionData = ir.exportToSectionFormat(0);

console.log(`Section binary data: ${sectionData.length} bytes`);

const info = {
  microblock: uint8.toHexa(new Uint8Array(32)),
  author: "Arnauld Chevallier"
};

  ir.setAsRedacted("this[0].*");
//ir.setAsRedacted("this[1].*");
//ir.setAsRedacted("this[2].*");

const proof = ir.exportToProof(info);
const proofAsText = JSON.stringify(proof, null, 2);

console.log(`Formatted proof: ${proofAsText.length} bytes`);

fs.writeFileSync("./proofs/proof1.json", proofAsText);
