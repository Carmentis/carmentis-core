import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class OrganizationMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);
            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
                SECTIONS.ORG_SIG_SCHEME
            );
            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
                SECTIONS.ORG_PUBLIC_KEY
            );
            checker.group(
                SECTIONS.AT_LEAST_ONE,
                [
                    [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_DESCRIPTION ],
                    [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_SERVER ]
                ]
            );
            checker.expects(SECTIONS.ONE, SECTIONS.ORG_SIGNATURE);
            checker.endsHere();
            return true;
        } catch {
            return false;
        }
    }

}