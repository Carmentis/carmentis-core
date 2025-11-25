import {ProtocolVBInternalStateObject} from "../../type/types";

export class ProtocolInternalState {
    constructor(private internalState: ProtocolVBInternalStateObject) {
    }

    static createFromInternalState(localState: ProtocolVBInternalStateObject) {
        return new ProtocolInternalState(localState);
    }

    static createInitialState() {
        return new ProtocolInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
            variables: []
        });
    }

    getInternalState(): ProtocolVBInternalStateObject {
        return this.internalState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.internalState.publicKeyHeight = publicKeyHeight;
    }
}