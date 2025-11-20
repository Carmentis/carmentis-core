import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {Microblock} from "../microblock/Microblock";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";

export class ValidatorNodeLocalStateUpdater implements ILocalStateUpdater<ValidatorNodeLocalState> {
    updateState(prevState: ValidatorNodeLocalState, microblock: Microblock): ValidatorNodeLocalState {
        return prevState;
    }
}