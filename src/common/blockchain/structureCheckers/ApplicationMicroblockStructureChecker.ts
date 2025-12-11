import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class ApplicationMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);

            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
                SECTIONS.APP_CREATION
            );
            checker.group(
                SECTIONS.AT_LEAST_ONE,
                [
                    [ SECTIONS.AT_MOST_ONE, SECTIONS.APP_DESCRIPTION ]
                ]
            );
            checker.expects(SECTIONS.ONE, SECTIONS.APP_SIGNATURE);
            checker.endsHere();
            return true;
        } catch {
            return false;
        }
    }
}