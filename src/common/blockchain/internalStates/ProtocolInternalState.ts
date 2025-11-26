import {ProtocolVBInternalStateObject} from "../../type/types";
import {IInternalState} from "./IInternalState";

export class ProtocolInternalState implements IInternalState {
    constructor(private internalState: ProtocolVBInternalStateObject) {
    }

    static createFromObject(localState: unknown) {
        return new ProtocolInternalState(<ProtocolVBInternalStateObject>localState);
    }

    static createInitialState() {
        return new ProtocolInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
            variables: []
        });
    }

    toObject(): ProtocolVBInternalStateObject {
        return this.internalState;
    }

    updateSignatureScheme(signatureSchemeId: number) {
        this.internalState.signatureSchemeId = signatureSchemeId;
    }

    updatePublicKeyHeight(publicKeyHeight: number) {
        this.internalState.publicKeyHeight = publicKeyHeight;
    }
}