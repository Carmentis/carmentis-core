import {AccountVBState} from "../../blockchain/types";
import {Utils} from "../../utils/utils";

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
}