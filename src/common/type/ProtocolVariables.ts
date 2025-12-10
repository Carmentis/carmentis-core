export interface ProtocolVariables {
    // general protocol versions
    protocolVersionName: string;
    protocolVersion: number;

    // fees calculation version
    feesCalculationVersion: number;

    // global state updater versions
    globalStateUpdaterVersion: number;

    // Internal state updater versions
    applicationLedgerInternalStateUpdaterVersion: number;
    applicationInternalStateUpdaterVersion: number;
    organizationInternalStateUpdaterVersion: number;
    validatorNodeInternalStateUpdaterVersion: number;
    accountInternalStateUpdaterVersion: number;
    protocolInternalStateUpdaterVersion: number;
}