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
                SECTIONS.VN_CREATION
            );
            checker.group(
                SECTIONS.AT_LEAST_ONE,
                checker.isFirstBlock() ? 
                    [
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_COMETBFT_PUBLIC_KEY_DECLARATION ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ]
                    ]
                :
                    [
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_COMETBFT_PUBLIC_KEY_DECLARATION ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_RPC_ENDPOINT ],
                        [ SECTIONS.AT_MOST_ONE, SECTIONS.VN_VOTING_POWER_UPDATE ]
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