import {ApplicationVBInternalStateObject} from "../../type/types";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
import {IInternalState} from "./IInternalState";

export class ApplicationInternalState implements IInternalState {
    constructor(private internalState: ApplicationVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        return new ApplicationInternalState(<ApplicationVBInternalStateObject>internalState);
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

    toObject(): ApplicationVBInternalStateObject {
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