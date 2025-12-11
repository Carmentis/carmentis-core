import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {Microblock} from "../microblock/Microblock";
import {MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../errors/carmentis-error";
import {Section} from "../../type/Section";
import {IMicroblockSearchFailureFallback} from "./fallbacks/IMicroblockSearchFailureFallback";
import {Height, Provider} from "../../common";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {IApplicationLedgerInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";


export class ApplicationLedgerMicroblockBuilder implements IMicroblockSearchFailureFallback {

    private stateUpdater?: IApplicationLedgerInternalStateUpdater;
    constructor(protected mbUnderConstruction: Microblock, protected vb: ApplicationLedgerVb, private provider: Provider) {

    }

    onMicroblockSearchFailureForExceedingHeight(vb: VirtualBlockchain, askedHeight: Height): Promise<Microblock> {
        const currentVbHeight = vb.getHeight();
        if (currentVbHeight + 1 === askedHeight) return Promise.resolve(this.mbUnderConstruction);
        throw new MicroBlockNotFoundInVirtualBlockchainAtHeightError(vb.getIdentifier(), askedHeight)
    }

    protected getBuiltMicroblock() {
        return this.mbUnderConstruction;
    }

    protected async updateStateWithSection(section: Section) {
        // if not already defined, create the state updater with the current protocol state
        if (!this.stateUpdater)  {
            const variables = await this.provider.getProtocolVariables();
            this.stateUpdater = InternalStateUpdaterFactory.createApplicationLedgerInternalStateUpdater(
                variables.getApplicationLedgerInternalStateUpdaterVersion()
            );
        }

        // update the internal state with the new section
        this.vb.setInternalState(
            await this.stateUpdater.updateStateFromSection(
                this.vb.getInternalState(),
                section,
                this.mbUnderConstruction.getHeight()
            )
        )
    }

    protected getInternalState() {
        return this.vb.getInternalState();
    }


}
