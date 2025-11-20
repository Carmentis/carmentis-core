import {AccountVBState} from "../../type/types";

export class AccountLocalState {
    constructor(private localState: AccountVBState) {
    }

    static createFromLocalState(localState: AccountVBState) {
        return new AccountLocalState(localState);
    }

    static createInitialState() {
        return new AccountLocalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0
        });
    }

    getLocalState(): AccountVBState {
        return this.localState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.localState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.localState.publicKeyHeight = publicKeyHeight;
    }

    getPublicKeyHeight() {
        return this.localState.publicKeyHeight;
    }

    getPublicKeySchemeId() {
        return this.localState.signatureSchemeId;
    }
}