
import {Microblock} from "../microblock/Microblock";
import {SectionNotFoundError} from "../../errors/carmentis-error";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

export class ApplicationInternalStateUpdater implements IInternalStateUpdater<ApplicationInternalState> {
    updateState(prevState: ApplicationInternalState, microblock: Microblock): ApplicationInternalState {
        const newState = prevState.clone();
        for (const section of microblock.getAllSections()) {
            if (section.type === SectionType.APP_CREATION) {
                newState.setOrganizationId(section.organizationId);
            }

            if (section.type === SectionType.APP_DESCRIPTION) {
                newState.setDescriptionHeight(microblock.getHeight());
            }
        }
        return newState;
    }
}