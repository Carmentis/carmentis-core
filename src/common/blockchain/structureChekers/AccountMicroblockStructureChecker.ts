import {IMicroblockStructureChecker} from "./IMicroblockStructureChecker";
import {StructureChecker} from "../microblock/StructureChecker";
import {Microblock} from "../microblock/Microblock";
import {SECTIONS} from "../../constants/constants";

export class AccountMicroblockStructureChecker implements IMicroblockStructureChecker {
    checkMicroblockStructure(microblock: Microblock): boolean {
        try {
            const checker = new StructureChecker(microblock);

            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
                SECTIONS.ACCOUNT_SIG_SCHEME
            );
            checker.expects(
                checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
                SECTIONS.ACCOUNT_PUBLIC_KEY
            );
            if(checker.isFirstBlock()) {
                checker.group(
                    SECTIONS.ONE,
                    [
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.ACCOUNT_TOKEN_ISSUANCE ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.ACCOUNT_CREATION ]
                    ]
                )
            }
            else {
                checker.group(
                    SECTIONS.AT_LEAST_ONE,
                    [
                        [ SECTIONS.ANY, SECTIONS.ACCOUNT_TRANSFER ]
                    ]
                );
            }
            checker.expects(SECTIONS.ONE, SECTIONS.ACCOUNT_SIGNATURE);
            checker.endsHere();
            return true;
        } catch {
            return false;
        }
    }
}