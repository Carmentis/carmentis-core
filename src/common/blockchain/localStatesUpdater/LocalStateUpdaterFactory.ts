import {IApplicationLedgerLocalStateUpdater, ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
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
import {ApplicationLocalStateUpdater} from "./ApplicationLocalStateUpdater";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";

export class LocalStateUpdaterFactory {
    static createApplicationLedgerLocalStateUpdater(localStateVersion: number): IApplicationLedgerLocalStateUpdater {
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

    static createApplicationLocalStateUpdater(localStateUpdateVersion: number) {
        switch (localStateUpdateVersion) {
            case 1: return new ApplicationLocalStateUpdater()
            default:
                throw new IllegalParameterError("Unknown validator node local state version");
        }
    }

    /**
     * Returns the default local state updater version for the given virtual blockchain type.
     *
     * @param {VirtualBlockchainType} type - The type of the virtual blockchain for which the updater version is needed.
     * @return {number} The default local state updater version associated with the specified virtual blockchain type.
     */
    static defaultLocalStateUpdaterVersionByVbType(type: VirtualBlockchainType): number {
        // since we do not have done any update now, the default local state updater version is at one for every VBs
        return 1;
    }
}