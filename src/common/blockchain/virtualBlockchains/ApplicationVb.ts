import {VirtualBlockchain} from "./VirtualBlockchain";
import {Microblock} from "../microblock/Microblock";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {ApplicationMicroblockStructureChecker} from "../structureCheckers/ApplicationMicroblockStructureChecker";
import {IProvider} from "../../providers/IProvider";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {Utils} from "../../utils/utils";

export class ApplicationVb extends VirtualBlockchain<ApplicationInternalState> {
    
    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider,  state: ApplicationInternalState = ApplicationInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, state);
    }


    protected async updateInternalState(protocolState: ProtocolInternalState, state: ApplicationInternalState, microblock: Microblock) {
        const stateUpdaterVersion = protocolState.getApplicationInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createApplicationInternalStateUpdater(
            stateUpdaterVersion
        );
        return localStateUpdater.updateState(this.provider, state, microblock);
    }

    async getVirtualBlockchainState() {
        const height = this.getHeight();
        const lastMicroblockHash = height === 0 ?
            Utils.getNullHash() :
            (await this.getLastMicroblock()).getHash().toBytes();
        return {
            expirationDay: this.getExpirationDay(),
            height: height,
            internalState: this.internalState.toObject(),
            lastMicroblockHash: lastMicroblockHash,
            type: this.getType()
        };
    }

    async getVirtualBlockchainOwnerId() {
        const orgId = this.internalState.getOrganizationId();
        const organizationVb = await this.provider.loadOrganizationVirtualBlockchain(orgId);
        return organizationVb.getVirtualBlockchainOwnerId();
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ApplicationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    /*
    async setSignatureScheme(object: any) {
        await this.addSection(SECTIONS.APP_SIG_SCHEME, object);
    }

    async setDeclaration(object: ApplicationDeclarationSection) {
        await this.addSection(SECTIONS.APP_DECLARATION, object);
    }

    async setDescription(object: ApplicationDescriptionSection) {
        await this.addSection(SECTIONS.APP_DESCRIPTION, object);
    }

    async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.APP_SIGNATURE, object);
    }



    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

     */

    getOrganizationId() {
        return this.internalState.getOrganizationId()
    }
}
