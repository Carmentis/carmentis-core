import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {Microblock} from "../microblock/Microblock";
import {MicroBlockNotFoundInVirtualBlockchainAtHeightError} from "../../errors/carmentis-error";
import {IApplicationLedgerLocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {Section} from "../../type/Section";
import {IMicroblockSearchFailureFallback} from "./fallbacks/IMicroblockSearchFailureFallback";
import {Height} from "../../common";
import {VirtualBlockchain} from "./VirtualBlockchain";


export class ApplicationLedgerMicroblockBuilder implements IMicroblockSearchFailureFallback {

    private stateUpdater: IApplicationLedgerLocalStateUpdater;
    constructor(protected mbUnderConstruction: Microblock, protected vb: ApplicationLedgerVb) {
        this.stateUpdater = LocalStateUpdaterFactory.createApplicationLedgerLocalStateUpdater(
            mbUnderConstruction.getLocalStateUpdateVersion()
        );
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
        this.vb.setLocalState(
            await this.stateUpdater.updateStateFromSection(
                this.vb.getLocalState(),
                section,
                this.mbUnderConstruction.getHeight()
            )
        )
    }

    protected getLocalState() {
        return this.vb.getLocalState();
    }


}
