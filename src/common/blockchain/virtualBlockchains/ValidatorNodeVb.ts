import {VirtualBlockchain} from "./VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {ValidatorNodeMicroblockStructureChecker} from "../structureCheckers/ValidatorNodeMicroblockStructureChecker";

import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Microblock} from "../microblock/Microblock";
import {IProvider} from "../../providers/IProvider";
import {IllegalStateError} from "../../errors/carmentis-error";
import {SectionType} from "../../type/SectionType";
import {ValidatorNodeCometbftPublicKeyDeclarationSection} from "../../type/sections";
import {ValidatorNodeInternalState} from "../internalStates/ValidatorNodeInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeInternalState> {


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider, state: ValidatorNodeInternalState = ValidatorNodeInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN, state);
    }

    protected async updateLocalState(state: ValidatorNodeInternalState, microblock: Microblock): Promise<ValidatorNodeInternalState> {
        const stateUpdater = InternalStateUpdaterFactory.createValidatorNodeInternalStateUpdater(microblock.getLocalStateUpdateVersion());
        return await stateUpdater.updateState(state, microblock)
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ValidatorNodeMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    async getCometbftPublicKeyDeclaration(): Promise<{cometbftPublicKey: string , cometbftPublicKeyType: string}> {
        const height = this.localState.getCometbftPublicKeyDeclarationHeight();
        if (height === 0) throw new IllegalStateError("Node has not declared its CometBFT public key yet");
        const microblock = await this.getMicroblock(height);
        const section = microblock.getSectionByType<ValidatorNodeCometbftPublicKeyDeclarationSection>(SectionType.VN_COMETBFT_PUBLIC_KEY_DECLARATION);
        const cometbftPublicKey = section.object.cometPublicKey;
        const cometbftPublicKeyType = section.object.cometPublicKeyType;
        return { cometbftPublicKeyType, cometbftPublicKey }
    }

    getNodeDeclarationHeight(): number {
        return this.getLocalState().getCometbftPublicKeyDeclarationHeight();
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
