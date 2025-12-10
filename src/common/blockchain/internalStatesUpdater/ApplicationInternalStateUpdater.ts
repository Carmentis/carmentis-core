
import {Microblock} from "../microblock/Microblock";
import {SectionNotFoundError} from "../../errors/carmentis-error";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";

export class ApplicationInternalStateUpdater implements IInternalStateUpdater<ApplicationInternalState> {
    updateState(prevState: ApplicationInternalState, microblock: Microblock): ApplicationInternalState {
        const newState = prevState.clone();
        try {
            const section = microblock.getApplicationDeclarationSection();
            newState.setOrganizationId(section.object.organizationId);
        } catch (e) {
            if (e instanceof SectionNotFoundError) {}
            else {
                throw e;
            }
        }

        try {
            const section = microblock.getApplicationDescriptionSection();
            newState.setDescriptionHeight(microblock.getHeight());
        } catch (e) {
            if (e instanceof SectionNotFoundError) {}
            else {
                throw e;
            }
        }

        return newState;
    }

    /*
    async signatureSchemeCallback(microblock: Microblock, section: Section) {
        this.getState().signatureSchemeId = section.object.schemeId;
    }

    async declarationCallback(microblock: Microblock, section: Section) {
        // TODO: check the organization
        this.getState().organizationId = section.object.organizationId;
    }

    async descriptionCallback(microblock: Microblock, section: Section) {
        this.getState().descriptionHeight = microblock.header.height;
    }
     */

}