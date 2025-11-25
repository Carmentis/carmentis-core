import {AccountVBInternalStateObject} from "../../type/types";

export class AccountInternalState {
    constructor(private internalState: AccountVBInternalStateObject) {
    }

    static createFromLocalState(localState: AccountVBInternalStateObject) {
        return new AccountInternalState(localState);
    }

    static createInitialState() {
        return new AccountInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0
        });
    }

    getLocalState(): AccountVBInternalStateObject {
        return this.internalState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.internalState.publicKeyHeight = publicKeyHeight;
    }

    getPublicKeyHeight() {
        return this.internalState.publicKeyHeight;
    }

    getPublicKeySchemeId() {
        return this.internalState.signatureSchemeId;
    }
}