import {ApplicationVBInternalStateObject} from "../../type/types";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";

export class ApplicationInternalState {
    constructor(private internalState: ApplicationVBInternalStateObject) {
    }

    static createFromInternalState(internalState: ApplicationVBInternalStateObject) {
        return new ApplicationInternalState(internalState);
    }

    static createInitialState() {
        return new ApplicationInternalState({
            signatureSchemeId: 0,
            organizationId: Utils.getNullHash(),
            descriptionHeight: 0
        });
    }

    clone() {
        return new ApplicationInternalState({...this.internalState})
    }

    getLocalState(): ApplicationVBInternalStateObject {
        return this.internalState;
    }

    setSignatureSchemeId(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    setOrganizationId(organizationId: Uint8Array) {
        this.internalState.organizationId = organizationId;
    }

    setDescriptionHeight(descriptionHeight: number) {
        this.internalState.descriptionHeight = descriptionHeight;
    }

    getOrganizationId(): Hash {
        return Hash.from(this.internalState.organizationId);
    }
}