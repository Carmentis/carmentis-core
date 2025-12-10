import {ProtocolVBInternalStateObject} from "../../type/types";
import {IInternalState} from "./IInternalState";
import {ProtocolVariables} from "../../type/ProtocolVariables";

enum ProtocolName {
    INITIAL_PROTOCOL_VERSION_NAME = "Stockolm"
}

export class ProtocolInternalState implements IInternalState {

    constructor(private internalState: ProtocolVBInternalStateObject) {
    }

    static createFromObject(internalState: unknown) {
        // TODO check type using better tools, currently we are limited to check if not undefined
        if (internalState === undefined) throw new Error("Provided internal state is undefined");
        const parsedInternalState = <ProtocolVBInternalStateObject>internalState;
        if (parsedInternalState.currentProtocolVariables === undefined) throw new Error("Provided internal state is missing currentProtocolVariables field: " + JSON.stringify(internalState, null, 2) + "")
        return new ProtocolInternalState(parsedInternalState);
    }

    static createInitialState() {
        return new ProtocolInternalState({
            signatureSchemeId: 0,
            publicKeyHeight: 0,
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
                protocolInternalStateUpdaterVersion: 1
            },
            protocolUpdates: []
        });
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
}