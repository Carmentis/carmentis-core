import {ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {Microblock, Section} from "../../blockchain/Microblock";
import {AccountLocalState} from "../localStates/AccountLocalState";
import {SECTIONS, ECO} from "../../constants/constants";
import {AccountVb} from "../../blockchain/AccountVb";

export class AccountLocalStateUpdater implements ILocalStateUpdater<AccountLocalState> {
    constructor() {}

    async updateState(prevState: AccountLocalState, microblock: Microblock) {
        const newState = AccountLocalState.createFromLocalState({
            ...prevState.getLocalState()
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

    private async signatureSchemeCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        state.updateSignatureScheme(section.object.schemeId);
    }

    private async publicKeyCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        state.updatePublicKeyHeight(microblock.header.height);
    }

    private async tokenIssuanceCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        if(section.object.amount != ECO.INITIAL_OFFER) {
            throw `the amount of the initial token issuance is not the expected one`;
        }
    }

    private async creationCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        microblock.setFeesPayerAccount(section.object.sellerAccount);
    }

    private async transferCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async vestingTransferCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        // FIXME: to be completed
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async escrowTransferCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        // FIXME: to be completed
        //const payeeVb = new AccountVb({ provider: this.provider });
        //await payeeVb.load(section.object.account);
        // Note: microblock.setFeesPayerAccount would need the account identifier which isn't available in this context
        // This might need to be handled differently in the new architecture
    }

    private async stakeCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        // TODO
    }

    private async signatureCallback(state: AccountLocalState, microblock: Microblock, section: Section) {
        // TODO
    }
}
