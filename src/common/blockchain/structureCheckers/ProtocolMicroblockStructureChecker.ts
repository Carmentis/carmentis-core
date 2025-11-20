import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";

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