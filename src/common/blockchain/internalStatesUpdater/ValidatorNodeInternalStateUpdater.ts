
import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/SectionType";
import {ValidatorNodeVotingPowerUpdateSection} from "../../type/sections";
import {Section} from "../../type/Section";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";

export class ValidatorNodeInternalStateUpdater implements IInternalStateUpdater<ValidatorNodeInternalState> {
    updateState(prevState: ValidatorNodeInternalState, microblock: Microblock): ValidatorNodeInternalState {
        const newState = prevState.clone();
        for (const section of microblock.getAllSections()) {
            switch (section.type) {
                case SectionType.VN_VOTING_POWER_UPDATE:
                    this.updateVotingPower(newState, section);
                    break;
                case SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION:
                    newState.setCometbftPublicKeyDeclarationHeight(microblock.getHeight());
                    break;
            }
        }
        return newState;
    }

    private updateVotingPower(state: ValidatorNodeInternalState, section: Section<ValidatorNodeVotingPowerUpdateSection>) {
        state.setVotingPower(section.object.votingPower)
    }


}