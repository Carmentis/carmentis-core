import {IInternalState} from "./IInternalState";
import {Utils} from "../../utils/utils";
import {
    ProtocolVBInternalStateObject,
    ProtocolVBInternalStateObjectSchema
} from "../../type/valibot/blockchain/virtualBlockchain/internalStates";
import * as v from 'valibot';
import {ProtocolVariables} from "../../type/valibot/blockchain/protocol/ProtocolVariables";
import {CMTSToken} from "../../economics/currencies/token";

enum ProtocolName {
    INITIAL_PROTOCOL_VERSION_NAME = "Stockholm"
}

export class ProtocolInternalState implements IInternalState {

    constructor(private internalState: ProtocolVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        const parseResult = v.safeParse(ProtocolVBInternalStateObjectSchema, internalState);
        if (parseResult.success) {
            return new ProtocolInternalState(parseResult.output)
        } else {
            throw new Error(`Provided internal state is not valid: ${parseResult.issues}` )
        }
    }

    static createInitialState() {
        return new ProtocolInternalState({
            organizationId: Utils.getNullHash(),
            currentProtocolVariables: {
                protocolVersionName: ProtocolName.INITIAL_PROTOCOL_VERSION_NAME,
                protocolVersion: 1,
                feesCalculationVersion: 1,
                globalStateUpdaterVersion: 1,
                applicationLedgerInternalStateUpdaterVersion: 1,
                applicationInternalStateUpdaterVersion: 1,
                organizationInternalStateUpdaterVersion: 1,
                validatorNodeInternalStateUpdaterVersion: 1,
                accountInternalStateUpdaterVersion: 1,
                protocolInternalStateUpdaterVersion: 1,
                minimumNodeStakingAmountInAtomics: CMTSToken.create(1_000_000).getAmountAsAtomic(),
                maximumNodeStakingAmountInAtomics: CMTSToken.create(10_000_000).getAmountAsAtomic(),
                unstakingDelayInDays: 30,
                maxBlockSizeInBytes: 4194304,
                abciVersion: 1,
            },
            protocolUpdates: []
        });
    }

    /**
     * Returns the ABCI version to use.
     *
     * See https://docs.cometbft.com/v0.38/spec/abci/
     */
    getAbciVersion() {
        return this.internalState.currentProtocolVariables.abciVersion;
    }

    /**
     * Returns the maximum block size in bytes allowed by the current protocol variables.
     */
    getMaximumBlockSizeInBytes() {
        return this.internalState.currentProtocolVariables.maxBlockSizeInBytes;
    }

    getProtocolVariables() {
        return this.internalState.currentProtocolVariables;
    }

    getApplicationLedgerInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.applicationLedgerInternalStateUpdaterVersion;
    }

    getApplicationInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.applicationInternalStateUpdaterVersion;
    }

    getOrganizationInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.organizationInternalStateUpdaterVersion;
    }

    getValidatorNodeInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.validatorNodeInternalStateUpdaterVersion;
    }

    getAccountInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.accountInternalStateUpdaterVersion;
    }

    getProtocolInternalStateUpdaterVersion() {
        return this.internalState.currentProtocolVariables.protocolInternalStateUpdaterVersion;
    }

    getMinimumNodeStakingAmountInAtomics() {
        return this.internalState.currentProtocolVariables.minimumNodeStakingAmountInAtomics;
    }

    getMaximumNodeStakingAmountInAtomics() {
        return this.internalState.currentProtocolVariables.maximumNodeStakingAmountInAtomics;
    }

    getUnstakingDelayInDays() {
        return this.internalState.currentProtocolVariables.unstakingDelayInDays;
    }

    toObject(): ProtocolVBInternalStateObject {
        return this.internalState;
    }

    getFeesCalculationVersion() {
        return this.internalState.currentProtocolVariables.feesCalculationVersion;
    }

    setProtocolVersion(protocolVersion: number) {
        this.internalState.currentProtocolVariables.protocolVersion = protocolVersion;
    }

    setProtocolVersionName(protocolVersionName: string) {
        this.internalState.currentProtocolVariables.protocolVersionName = protocolVersionName;
    }

    setProtocolVariables(protocolVariables: ProtocolVariables) {
        this.internalState.currentProtocolVariables = protocolVariables;
    }

	setOrganizationId(organizationId: Uint8Array) {
		this.internalState.organizationId = organizationId;
	}
}