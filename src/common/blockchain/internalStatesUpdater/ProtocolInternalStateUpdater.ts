import {Microblock} from "../microblock/Microblock";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {Logger} from "../../utils/Logger";
import {IProvider} from "../../providers/IProvider";

export class ProtocolInternalStateUpdater implements IInternalStateUpdater<ProtocolInternalState> {
    private logger = Logger.getInternalStateUpdaterLogger(ProtocolInternalStateUpdater.name)
    updateState(provider: IProvider, prevState: ProtocolInternalState, microblock: Microblock): ProtocolInternalState {
        // we search for protocol variables update
        for (const section of microblock.getAllSections()) {
            if (section.type === SectionType.PROTOCOL_UPDATE) {
                const protocolUpdate = section;
                this.logger.debug(`Updating protocol variables: ${JSON.stringify(protocolUpdate.protocolVariables)}`);
                prevState.setProtocolVariables(protocolUpdate.protocolVariables);
            }
        }
        return prevState;
    }

}