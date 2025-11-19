import {ApplicationVBState} from "../../type/types";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";

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

    clone() {
        return new ApplicationLocalState({...this.localState})
    }

    getLocalState(): ApplicationVBState {
        return this.localState;
    }

    setSignatureSchemeId(signatureSchemeId: number) {
        this.localState.signatureSchemeId = signatureSchemeId;
    }

    setOrganizationId(organizationId: Uint8Array) {
        this.localState.organizationId = organizationId;
    }

    setDescriptionHeight(descriptionHeight: number) {
        this.localState.descriptionHeight = descriptionHeight;
    }

    getOrganizationId(): Hash {
        return Hash.from(this.localState.organizationId);
    }
}