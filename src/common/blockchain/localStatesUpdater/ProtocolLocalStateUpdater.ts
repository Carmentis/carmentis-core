import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {Microblock} from "../microblock/Microblock";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";

export class ProtocolLocalStateUpdater implements ILocalStateUpdater<ProtocolLocalState> {
    updateState(prevState: ProtocolLocalState, microblock: Microblock): ProtocolLocalState {
        return prevState
    }

}