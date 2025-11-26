
import {Microblock} from "../microblock/Microblock";
import {ECO, SECTIONS} from "../../constants/constants";
import {Section} from "../../type/Section";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {AccountInternalState} from "../internalStates/AccountInternalState";

export class AccountInternalStateUpdater implements IInternalStateUpdater<AccountInternalState> {
    constructor() {}

    async updateState(prevState: AccountInternalState, microblock: Microblock) {
        const newState = AccountInternalState.createFromObject({
            ...prevState.toObject()
        });

        // Process all sections in the microblock
        const sections = microblock.getAllSections();
        
        for (const section of sections) {
            switch (section.type) {
                case SECTIONS.ACCOUNT_SIG_SCHEME:
                    await this.signatureSchemeCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_PUBLIC_KEY:
                    await this.publicKeyCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_TOKEN_ISSUANCE:
                    await this.tokenIssuanceCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_CREATION:
                    await this.creationCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_TRANSFER:
                    await this.transferCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_VESTING_TRANSFER:
                    await this.vestingTransferCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_ESCROW_TRANSFER:
                    await this.escrowTransferCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_STAKE:
                    await this.stakeCallback(newState, microblock, section);
                    break;
                case SECTIONS.ACCOUNT_SIGNATURE:
                    await this.signatureCallback(newState, microblock, section);
                    break;
            }
        }

        return newState;
    }

    private async signatureSchemeCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        state.updateSignatureScheme(section.object.schemeId);
    }

    private async publicKeyCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        state.updatePublicKeyHeight(microblock.getHeight());
    }

    private async tokenIssuanceCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        if (section.object.amount != ECO.INITIAL_OFFER) {
            throw new Error(`the amount of the initial token issuance is not the expected one`);
        }
    }

    private async creationCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        microblock.setFeesPayerAccount(section.object.sellerAccount);
    }

    private async transferCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async vestingTransferCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        // FIXME: to be completed
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async escrowTransferCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        // FIXME: to be completed
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async stakeCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        // TODO
    }

    private async signatureCallback(state: AccountInternalState, microblock: Microblock, section: Section) {
        // TODO
    }
}
