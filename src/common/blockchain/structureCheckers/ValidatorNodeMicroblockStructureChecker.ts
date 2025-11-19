import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "./StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class ValidatorNodeMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);

            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
                SECTIONS.VN_SIG_SCHEME
            );
            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
                SECTIONS.VN_DECLARATION
            );
            checker.group(
                SECTIONS.AT_LEAST_ONE,
                checker.isFirstBlock() ? 
                    [
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_DESCRIPTION ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ]
                    ]
                :
                    [
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_DESCRIPTION ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_NETWORK_INTEGRATION ]
                    ]
            );
            checker.expects(SECTIONS.ONE, SECTIONS.VN_SIGNATURE);
            checker.endsHere();
            return true;
        } catch {
            return false;
        }
    }
}