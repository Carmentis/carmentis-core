import {ProtocolVBState, ValidatorNodeVBState} from "../../blockchain/types";
import {Utils} from "../../utils/utils";
export class ValidatorNodeLocalState {
    constructor(private localState: ValidatorNodeVBState) {
    }

    static createFromLocalState(localState: ValidatorNodeVBState) {
        return new ValidatorNodeLocalState(localState);
    }

    static createInitialState() {
        return new ValidatorNodeLocalState({
            descriptionHeight: 0,
            networkIntegrationHeight: 0,
            organizationId: Utils.getNullHash(),
            rpcEndpointHeight: 0,
            signatureSchemeId: 0
        });
    }
}