
import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/SectionType";
import {ValidatorNodeCreationSection, ValidatorNodeVotingPowerUpdateSection} from "../../type/sections";
import {Section} from "../../type/Section";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";

export class ValidatorNodeInternalStateUpdater implements IInternalStateUpdater<ValidatorNodeInternalState> {
    updateState(prevState: ValidatorNodeInternalState, microblock: Microblock): ValidatorNodeInternalState {
        const newState = prevState;
        for (const section of microblock.getAllSections()) {
            switch (section.type) {
                case SectionType.VN_CREATION:
                    const declarationSection = section as Section<ValidatorNodeCreationSection>;
                    newState.setOrganizationId(declarationSection.object.organizationId);
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

    private updateVotingPower(state: ValidatorNodeInternalState, section: Section<ValidatorNodeVotingPowerUpdateSection>) {
        state.setVotingPower(section.object.votingPower)
    }


}