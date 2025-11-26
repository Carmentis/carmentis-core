import {OrganizationVBInternalStateObject} from "../../type/types";

export class OrganizationInternalState {
    constructor(private internalState: OrganizationVBInternalStateObject) {
    }

    static createFromObject(localState: unknown) {
        return new OrganizationInternalState(<OrganizationVBInternalStateObject>localState);
    }

    static createInitialState() {
        return new OrganizationInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
            descriptionHeight: 0
        });
    }

    toObject(): OrganizationVBInternalStateObject {
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