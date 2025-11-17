import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";
import {Microblock} from "../../blockchain/Microblock";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";

export class ProtocolLocalStateUpdater implements ILocalStateUpdater<ProtocolLocalState> {
    updateState(prevState: ProtocolLocalState, microblock: Microblock): ProtocolLocalState {
        // TODO: derive state
        return prevState;
    }
}