import {OrganizationVBInternalStateObject} from "../../type/types";

export class OrganizationInternalState {
    constructor(private internalState: OrganizationVBInternalStateObject) {
    }

    static createFromInternalState(localState: OrganizationVBInternalStateObject) {
        return new OrganizationInternalState(localState);
    }

    static createInitialState() {
        return new OrganizationInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
            descriptionHeight: 0
        });
    }

    getInternalState(): OrganizationVBInternalStateObject {
        return this.internalState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.internalState.publicKeyHeight = publicKeyHeight;
    }

    updateDescriptionHeight(descriptionHeight: number) {
        this.internalState.descriptionHeight = descriptionHeight;
    }

    getPublicKeyDefinitionHeight() {
        return this.internalState.publicKeyHeight;
    }

    getPublicSignatureKeySchemeId() {
        return this.internalState.signatureSchemeId
    }

    getDescriptionHeight() {
        return this.internalState.descriptionHeight;
    }
}