
import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/SectionType";
import {
    OrganizationDescriptionSection,
    OrganizationCreationSection,
} from "../../type/sections";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";

export class OrganizationInternalStateUpdater implements IInternalStateUpdater<OrganizationInternalState> {
    updateState(internalState: OrganizationInternalState, microblock: Microblock): OrganizationInternalState {
        // update height where the public key is defined
        const signaturePublicKeyDefinitionSections = microblock.getSections<OrganizationCreationSection>(
            s => s.type === SectionType.ORG_CREATION
        );
        if (signaturePublicKeyDefinitionSections.length !== 0) {
            if (signaturePublicKeyDefinitionSections.length !== 1) throw new Error('Cannot accept multiple signature creation');
            const section = microblock.getOrganizationCreationSection();
            internalState.setAccountId(section.object.accountId);
        }

        // update the description
        const descSections = microblock.getSections<OrganizationDescriptionSection>(
            s => s.type === SectionType.ORG_DESCRIPTION
        );
        if (descSections.length !== 0) {
            if (descSections.length !== 1) throw new Error('Cannot accept multiple descriptions');
            internalState.updateDescriptionHeight(microblock.getHeight())
        }

        return internalState;
    }

    /*
    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getPublicKey();

        const isMicroBlockSignatureValid = microblock.verifySignature(
            publicKey,
            section.object.signature,
            true,
            section.index
        );

        if(!isMicroBlockSignatureValid) {
            throw `invalid signature`;
        }

        const publicKeyHash = Crypto.Hashes.sha256AsBinary(publicKey.getPublicKeyAsBytes());
        const feesPayerAccount = await this.provider.getAccountByPublicKeyHash(publicKeyHash);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

     */
}