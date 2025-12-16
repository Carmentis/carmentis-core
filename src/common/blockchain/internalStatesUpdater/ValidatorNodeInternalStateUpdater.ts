
import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";
import {ValidatorNodeVotingPowerUpdateSection} from "../../type/valibot/blockchain/section/sections";

export class ValidatorNodeInternalStateUpdater implements IInternalStateUpdater<ValidatorNodeInternalState> {
    updateState(prevState: ValidatorNodeInternalState, microblock: Microblock): ValidatorNodeInternalState {
        const newState = prevState;
        for (const section of microblock.getAllSections()) {
            switch (section.type) {
                case SectionType.VN_CREATION:
                    newState.setOrganizationId(section.organizationId);
                    break;
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

    private updateVotingPower(state: ValidatorNodeInternalState, section: ValidatorNodeVotingPowerUpdateSection) {
        state.setVotingPower(section.votingPower)
    }


}