import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";
import {ValidatorNodeVBInternalStateObject} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";

export class ValidatorNodeInternalState {
    constructor(private internalState: ValidatorNodeVBInternalStateObject) {
    }

    static createFromObject(localState: unknown) {
        return new ValidatorNodeInternalState(<ValidatorNodeVBInternalStateObject>localState);
    }

    static createInitialState() {
        return new ValidatorNodeInternalState({
            cometbftPublicKeyDeclarationHeight: 0,
            lastKnownVotingPower: 0,
            organizationId: Utils.getNullHash(),
            rpcEndpointHeight: 0,
        });
    }

    toObject() {
        return this.internalState
    }

    getOrganizationId() {
        return Hash.from(this.internalState.organizationId);
    }

    getLastKnownVotingPower(): number {
        return this.internalState.lastKnownVotingPower;
    }

    getCometbftPublicKeyDeclarationHeight() {
        return this.internalState.cometbftPublicKeyDeclarationHeight;
    }

    getRpcEndpointHeight() {
        return this.internalState.rpcEndpointHeight;
    }

    clone() {
        return structuredClone(this)
    }

    setVotingPower(votingPower: number) {
        this.internalState.lastKnownVotingPower = votingPower;
    }

    setCometbftPublicKeyDeclarationHeight(height: number) {
        this.internalState.cometbftPublicKeyDeclarationHeight = height
    }

    setOrganizationId(organizationId: Uint8Array) {
        this.internalState.organizationId = organizationId;
    }

    setRpcEndpointDeclarationHeight(height: number) {
        this.internalState.rpcEndpointHeight = height;
    }
}