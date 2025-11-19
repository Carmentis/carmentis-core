import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "../microblock/StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class ProtocolMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            // TODO: implement structure check logic
            return true;
        } catch {
            return false;
        }
    }
}