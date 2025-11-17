

import {Microblock} from "../../blockchain/Microblock";
import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";

export class AppLedgerLocalStateUpdaterV1 implements ILocalStateUpdater<ApplicationLedgerLocalState> {
    updateState(prevState: ApplicationLedgerLocalState, microblock: Microblock): ApplicationLedgerLocalState {
        // TODO: derive state
        return prevState;
    }
}
