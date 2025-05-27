import * as fs from "fs";
import { intermediateRepresentation } from "./intermediateRepresentation.js";
import * as uint8 from "../util/uint8.js";

const proofAsText = fs.readFileSync("./proofs/proof1.json");
const proof = JSON.parse(proofAsText);

const ir = new intermediateRepresentation;

ir.importFromProof(proof);
