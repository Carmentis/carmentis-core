import * as fs from "fs";
import { IntermediateRepresentation } from "./intermediateRepresentation.js";

const proofAsText = fs.readFileSync("./proofs/proof1.json");
const proof = JSON.parse(proofAsText);

const ir = new IntermediateRepresentation;

ir.importFromProof(proof);

console.log(ir.exportToJson());
