import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {Microblock} from "../microblock/Microblock";
import {ApplicationLocalState} from "../localStates/ApplicationLocalState";
import {SectionNotFoundError} from "../../errors/carmentis-error";

export class ApplicationLocalStateUpdater implements ILocalStateUpdater<ApplicationLocalState> {
    updateState(prevState: ApplicationLocalState, microblock: Microblock): ApplicationLocalState {
        const newState = prevState.clone();

        try {
            const section = microblock.getApplicationSignatureSchemeSection();
            newState.setSignatureSchemeId(section.object.schemeId);
        } catch (e) {
            if (e instanceof SectionNotFoundError) {

            } else {
                throw e;
            }
        }

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