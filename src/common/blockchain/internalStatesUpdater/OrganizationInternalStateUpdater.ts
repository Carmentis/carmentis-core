
import {Microblock} from "../microblock/Microblock";
import {SectionType} from "../../type/SectionType";
import {
    OrganizationDescriptionSection,
    OrganizationPublicKeySection,
} from "../../type/sections";
import {IInternalStateUpdater} from "../internalStates/IInternalStateUpdater";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";

export class OrganizationInternalStateUpdater implements IInternalStateUpdater<OrganizationInternalState> {
    updateState(localState: OrganizationInternalState, microblock: Microblock): OrganizationInternalState {
        // update height where the public key is defined
        const signaturePublicKeyDefinitionSections = microblock.getSections<OrganizationPublicKeySection>(
            s => s.type === SectionType.ORG_PUBLIC_KEY
        );
        if (signaturePublicKeyDefinitionSections.length !== 0) {
            if (signaturePublicKeyDefinitionSections.length !== 1) throw new Error('Cannot accept multiple signature public keys');
            localState.updateDescriptionHeight(microblock.getHeight());
            localState.updateSignatureScheme(microblock.getHeight());
        }

        // update the description
        const descSections = microblock.getSections<OrganizationDescriptionSection>(
            s => s.type === SectionType.ORG_DESCRIPTION
        );
        if (descSections.length !== 0) {
            if (descSections.length !== 1) throw new Error('Cannot accept multiple descriptions');
            localState.updateDescriptionHeight(microblock.getHeight())
        }

        return localState;
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