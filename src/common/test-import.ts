
import * as fs from "fs";
import { IntermediateRepresentation } from "./records/intermediateRepresentation";

const proofAsText = fs.readFileSync("./proofs/proof1.json", 'utf-8');
const proof = JSON.parse(proofAsText);

const ir = new IntermediateRepresentation;

ir.importFromProof(proof);

console.log(ir.exportToJson());
