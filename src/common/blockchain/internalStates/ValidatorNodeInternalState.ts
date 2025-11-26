import {ValidatorNodeVBInternalStateObject} from "../../type/types";
import {Utils} from "../../utils/utils";
import {Hash} from "../../entities/Hash";

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
            signatureSchemeId: 0
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

    getSignatureSchemeId() {
        return this.internalState.signatureSchemeId;
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
}