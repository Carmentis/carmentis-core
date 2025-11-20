import {VirtualBlockchain} from "./VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {ValidatorNodeMicroblockStructureChecker} from "../structureCheckers/ValidatorNodeMicroblockStructureChecker";

import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Microblock} from "../microblock/Microblock";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeLocalState> {


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider, state: ValidatorNodeLocalState = ValidatorNodeLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN, state);
    }

    protected async updateLocalState(state: ValidatorNodeLocalState, microblock: Microblock): Promise<ValidatorNodeLocalState> {
        const stateUpdater = LocalStateUpdaterFactory.createValidatorNodeLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        return await stateUpdater.updateState(state, microblock)
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ValidatorNodeMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    /**
     Update methods
     */
    /*
    async setSignatureScheme(object: any) {
      await this.addSection(SECTIONS.VN_SIG_SCHEME, object);
    }

    async setDeclaration(object: ValidatorNodeDeclarationSection) {
      await this.addSection(SECTIONS.VN_DECLARATION, object);
    }

    async setDescription(object: ValidatorNodeDescriptionSection) {
      await this.addSection(SECTIONS.VN_DESCRIPTION, object);
    }

    async setRpcEndpoint(object: ValidatorNodeRpcEndpointSection) {
      await this.addSection(SECTIONS.VN_RPC_ENDPOINT, object);
    }

    async setNetworkIntegration(object: ValidatorNodeVotingPowerUpdateSection) {
      await this.addSection(SECTIONS.VN_NETWORK_INTEGRATION, object);
    }

    async setSignature(privateKey: PrivateSignatureKey) {
      const object = this.createSignature(privateKey);
      await this.addSection(SECTIONS.VN_SIGNATURE, object);
    }

    getDescriptionHeight(): number {
      return this.getState().descriptionHeight;
    }

    getRpcEndpointHeight(): number {
      return this.getState().rpcEndpointHeight;
    }

    getNetworkIntegrationHeight(): number {
      return this.getState().networkIntegrationHeight;
    }

     */

    /**
     Section callbacks
     */

    /*
    async signatureSchemeCallback(microblock: any, section: any) {
      this.getState().signatureSchemeId = section.object.schemeId;
    }

    async declarationCallback(microblock: any, section: any) {
      this.getState().organizationId = section.object.organizationId;
    }

    async descriptionCallback(microblock: any, section: any) {
      this.getState().descriptionHeight = microblock.header.height;
    }

    async rpcEndpointCallback(microblock: any, section: any) {
      this.getState().rpcEndpointHeight = microblock.header.height;
    }

    async networkIntegrationCallback(microblock: any, section: any) {
      this.getState().networkIntegrationHeight = microblock.header.height;
    }

     */
    

    async getOrganizationVirtualBlockchain() {
        const orgId = this.localState.getOrganizationId();
        return await this.provider.loadOrganizationVirtualBlockchain(orgId);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        const orgVb = await this.getOrganizationVirtualBlockchain();
        return await orgVb.getPublicKey();
    }


}
