import {Microblock} from "../microblock/Microblock";
import {CMTSToken} from "../../economics/currencies/token";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {IProvider} from "../../providers/IProvider";

export interface IFeesFormula {
    /**
     * Compute the fees for a given microblock.
     *
     * The fees calculation should satisfy the following constraints:
     * - fees formula should only depend on the *signed* information.
     * - fees formula should not depend on the last microblock signature (the sealing signature).
     *
     * @param schemeId
     * @param microblock
     */
    computeFees(
        vbId: Uint8Array,
        schemeId: SignatureSchemeId,
        microblock: Microblock
    ): Promise<CMTSToken>
}