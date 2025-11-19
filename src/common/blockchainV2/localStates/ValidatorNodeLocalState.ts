import {ProtocolVBState, ValidatorNodeVBState} from "../../blockchain/types";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
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

    getOrganizationId() {
        return Hash.from(this.localState.organizationId);
    }

    getDescriptionHeight() {
        return this.localState.descriptionHeight;
    }

    getNetworkIntegrationHeight() {
        return this.localState.networkIntegrationHeight;
    }

    getRpcEndpointHeight() {
        return this.localState.rpcEndpointHeight;
    }

    getSignatureSchemeId() {
        return this.localState.signatureSchemeId;
    }

}