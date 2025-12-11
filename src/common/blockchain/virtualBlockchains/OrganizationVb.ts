import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {Microblock} from "../microblock/Microblock";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {OrganizationMicroblockStructureChecker} from "../structureCheckers/OrganizationMicroblockStructureChecker";
import {OrganizationDescriptionSection} from "../../type/sections";
import {IProvider} from "../../providers/IProvider";
import {OrganizationInternalState} from "../internalStates/OrganizationInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {Hash} from "../../entities/Hash";

export class OrganizationVb extends VirtualBlockchain<OrganizationInternalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static createOrganizationVirtualBlockchain(provider: IProvider) {
        return new OrganizationVb(provider);
    }

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------

    constructor(provider: IProvider, state: OrganizationInternalState = OrganizationInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN, state)
    }



    protected async updateInternalState(protocolState: ProtocolInternalState, state: OrganizationInternalState, microblock: Microblock) {
        const stateUpdateVersion = protocolState.getOrganizationInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createOrganizationInternalStateUpdater(
                stateUpdateVersion
            );
        return localStateUpdater.updateState(state, microblock);
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new OrganizationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
    }

    getAccountId(): Hash {
        return this.internalState.getAccountId();
    }

    async getDescription() : Promise<OrganizationDescriptionSection> {
        const descriptionHeight = this.internalState.getDescriptionHeight();
        const microblock = await this.getMicroblock(descriptionHeight);
        const section = microblock.getOrganizationDescriptionSection();
        return section.object;
    }

}
