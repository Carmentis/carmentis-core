import {IMicroblockSearchFailureFallback} from "./IMicroblockSearchFailureFallback";
import {VirtualBlockchain} from "../VirtualBlockchain";
import {Height} from "../../../type/Height";
import {Microblock} from "../../microblock/Microblock";
import {MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../../errors/carmentis-error";

export class ThrownErrorMicroblockSearchFailureFallback implements IMicroblockSearchFailureFallback {
    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock> {
        throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(vb.getIdentifier(), askedHeight)
    }
}