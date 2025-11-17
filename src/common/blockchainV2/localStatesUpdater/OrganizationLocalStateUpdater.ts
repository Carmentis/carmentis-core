import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {OrganizationLocalState} from "../localStates/OrganizationLocalState";
import {Microblock} from "../../blockchain/Microblock";

export class OrganizationLocalStateUpdater implements ILocalStateUpdater<OrganizationLocalState> {
    updateState(prevState: OrganizationLocalState, microblock: Microblock): OrganizationLocalState {
        return prevState;
    }
}