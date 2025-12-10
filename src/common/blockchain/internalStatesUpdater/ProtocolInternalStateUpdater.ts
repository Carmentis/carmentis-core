import {Microblock} from "../microblock/Microblock";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {SectionType} from "../../type/SectionType";
import {getLogger} from "@logtape/logtape";
import {Logger} from "../../utils/Logger";

export class ProtocolInternalStateUpdater implements IInternalStateUpdater<ProtocolInternalState> {
    private logger = Logger.getInternalStateUpdaterLogger(ProtocolInternalStateUpdater.name)
    updateState(prevState: ProtocolInternalState, microblock: Microblock): ProtocolInternalState {
        // we search for protocol variables update
        const hasVariablesToUpdate = microblock.hasSection(SectionType.PROTOCOL_UPDATE);
        if (hasVariablesToUpdate) {
            const section = microblock.getProtocolUpdateSection();
            const protocolUpdate = section.object;
            this.logger.debug(`Updating protocol variables: ${JSON.stringify(protocolUpdate.protocolVariables)}`);
            prevState.setProtocolVariables(protocolUpdate.protocolVariables);
        }
        return prevState;
    }

}