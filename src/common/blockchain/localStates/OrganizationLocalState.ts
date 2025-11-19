import {OrganizationVBState} from "../../type/types";
import {Utils} from "../../utils/utils";

export class OrganizationLocalState {
    constructor(private localState: OrganizationVBState) {
    }

    static createFromLocalState(localState: OrganizationVBState) {
        return new OrganizationLocalState(localState);
    }

    static createInitialState() {
        return new OrganizationLocalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
            descriptionHeight: 0
        });
    }

    getLocalState(): OrganizationVBState {
        return this.localState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.localState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.localState.publicKeyHeight = publicKeyHeight;
    }

    updateDescriptionHeight(descriptionHeight: number) {
        this.localState.descriptionHeight = descriptionHeight;
    }

    getPublicKeyDefinitionHeight() {
        return this.localState.publicKeyHeight;
    }

    getPublicSignatureKeySchemeId() {
        return this.localState.signatureSchemeId
    }

    getDescriptionHeight() {
        return this.localState.descriptionHeight;
    }
}