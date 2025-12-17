import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class OrganizationMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
                SECTIONS.ORG_CREATION
            );
            checker.group(
                SECTIONS.AT_LEAST_ONE,
                [
                ]
            );
            checker.expects(SECTIONS.ONE, SECTIONS.SIGNATURE);
            checker.endsHere();
            return true;
        } catch {
            return false;
        }
    }

}