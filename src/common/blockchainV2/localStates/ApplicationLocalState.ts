import {ApplicationVBState} from "../../blockchain/types";
import {Utils} from "../../utils/utils";

export class ApplicationLocalState {
    constructor(private localState: ApplicationVBState) {
    }

    static createFromLocalState(localState: ApplicationVBState) {
        return new ApplicationLocalState(localState);
    }

    static createInitialState() {
        return new ApplicationLocalState({
            signatureSchemeId: 0,
            organizationId: Utils.getNullHash(),
            descriptionHeight: 0
        });
    }

    getLocalState(): ApplicationVBState {
        return this.localState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.localState.signatureSchemeId = signatureSchemeId;
    }

    updateOrganizationId(organizationId: Uint8Array) {
        this.localState.organizationId = organizationId;
    }

    updateDescriptionHeight(descriptionHeight: number) {
        this.localState.descriptionHeight = descriptionHeight;
    }
}