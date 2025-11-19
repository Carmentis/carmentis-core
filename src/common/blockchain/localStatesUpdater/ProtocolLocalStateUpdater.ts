import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";
import {Microblock} from "../microblock/Microblock";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";

export class ProtocolLocalStateUpdater implements ILocalStateUpdater<ProtocolLocalState> {
    updateState(prevState: ProtocolLocalState, microblock: Microblock): ProtocolLocalState {
        return prevState
    }

}