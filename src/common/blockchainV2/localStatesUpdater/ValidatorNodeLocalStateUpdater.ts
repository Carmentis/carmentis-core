import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {OrganizationLocalState} from "../localStates/OrganizationLocalState";
import {Microblock} from "../../blockchain/Microblock";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";

export class ValidatorNodeLocalStateUpdater implements ILocalStateUpdater<ValidatorNodeLocalState> {
    updateState(prevState: ValidatorNodeLocalState, microblock: Microblock): ValidatorNodeLocalState {
        return prevState;
    }
}