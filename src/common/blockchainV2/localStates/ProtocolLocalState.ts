import {ProtocolVBState} from "../../blockchain/types";
import {Utils} from "../../utils/utils";

export class ProtocolLocalState {
    constructor(private localState: ProtocolVBState) {
    }

    static createFromLocalState(localState: ProtocolVBState) {
        return new ProtocolLocalState(localState);
    }

    static createInitialState() {
        return new ProtocolLocalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0
        });
    }

    getLocalState(): ProtocolVBState {
        return this.localState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.localState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.localState.publicKeyHeight = publicKeyHeight;
    }
}