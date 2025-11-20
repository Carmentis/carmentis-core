import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Utils} from "../../utils/utils";
import {Provider} from "../../providers/Provider";
import {ValidatorNodeVBState} from "../../type/types";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {
    ValidatorNodeMicroblockStructureChecker
} from "../structureCheckers/ValidatorNodeMicroblockStructureChecker";

import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import { Microblock } from "../microblock/Microblock";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {ValidatorNodeLocalState} from "../localStates/ValidatorNodeLocalState";
import {OrganizationVb} from "./OrganizationVb";
import {Hash} from "../../entities/Hash";

export class ValidatorNodeVb extends VirtualBlockchain {


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider, private state: ValidatorNodeLocalState = ValidatorNodeLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN, new ValidatorNodeMicroblockStructureChecker());
    }

    setLocalState(state: ValidatorNodeLocalState) {
        this.state = state
    }

    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const stateUpdater = LocalStateUpdaterFactory.createValidatorNodeLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        this.state = await stateUpdater.updateState(this.state, microblock)
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
        const orgId = this.state.getOrganizationId();
        return await this.provider.loadOrganizationVirtualBlockchain(orgId);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        const orgVb = await this.getOrganizationVirtualBlockchain();
        return await orgVb.getPublicKey();
    }


}
