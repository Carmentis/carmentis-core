import {Microblock} from "../microblock/Microblock";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";

export class ProtocolInternalStateUpdater implements IInternalStateUpdater<ProtocolInternalState> {
    updateState(prevState: ProtocolInternalState, microblock: Microblock): ProtocolInternalState {
        return prevState
    }

}