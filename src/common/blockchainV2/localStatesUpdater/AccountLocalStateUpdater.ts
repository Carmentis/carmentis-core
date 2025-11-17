import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {Microblock} from "../../blockchain/Microblock";
import {AccountLocalState} from "../localStates/AccountLocalState";

export class AccountLocalStateUpdater implements ILocalStateUpdater<AccountLocalState> {
    updateState(prevState: AccountLocalState, microblock: Microblock): AccountLocalState {
        // TODO: derive state
        return prevState;
    }
}
