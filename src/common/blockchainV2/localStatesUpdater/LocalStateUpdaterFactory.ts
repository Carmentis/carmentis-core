import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {AppLedgerLocalStateUpdaterV1} from "./ApplicationLedgerLocalStateUpdater";
import {IllegalParameterError} from "../../errors/carmentis-error";
import {AccountLocalState} from "../localStates/AccountLocalState";
import {OrganizationLocalState} from "../localStates/OrganizationLocalState";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";
import {ValidatorNodeLocalStateUpdater} from "./ValidatorNodeLocalStateUpdater";
import {ProtocolLocalStateUpdater} from "./ProtocolLocalStateUpdater";
import {OrganizationLocalStateUpdater} from "./OrganizationLocalStateUpdater";
import {AccountLocalStateUpdater} from "./AccountLocalStateUpdater";

export class LocalStateUpdaterFactory {
    static createApplicationLedgerLocalStateUpdater(localStateVersion: number): ILocalStateUpdater<ApplicationLedgerLocalState> {
        switch (localStateVersion) {
            case 1: return new AppLedgerLocalStateUpdaterV1;
            default: throw new IllegalParameterError("Unknown application local state version");
        }
    }

    static createAccountLocalStateUpdater(localStateVersion: number): ILocalStateUpdater<AccountLocalState> {
        switch (localStateVersion) {
            case 1: return new AccountLocalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown account local state version");
        }
    }

    static createOrganizationLocalStateUpdater(localStateVersion: number): ILocalStateUpdater<OrganizationLocalState> {
        switch (localStateVersion) {
            case 1: return new OrganizationLocalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown organization local state version");
        }
    }

    static createProtocolLocalStateUpdater(localStateVersion: number): ILocalStateUpdater<ProtocolLocalState> {
        switch (localStateVersion) {
            case 1: return new ProtocolLocalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown protocol local state version");
        }
    }

    static createValidatorNodeLocalStateUpdater(localStateVersion: number): ILocalStateUpdater<ValidatorNodeLocalState> {
        switch (localStateVersion) {
            case 1: return new ValidatorNodeLocalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown validator node local state version");
        }
    }

}