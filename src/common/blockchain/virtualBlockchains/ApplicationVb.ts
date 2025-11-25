import {VirtualBlockchain} from "./VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Microblock} from "../microblock/Microblock";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {ApplicationMicroblockStructureChecker} from "../structureCheckers/ApplicationMicroblockStructureChecker";
import {IProvider} from "../../providers/IProvider";
import {ApplicationInternalState} from "../internalStates/ApplicationInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";

export class ApplicationVb extends VirtualBlockchain<ApplicationInternalState> {
    
    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider,  state: ApplicationInternalState = ApplicationInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, state);
    }


    protected async updateLocalState(state: ApplicationInternalState, microblock: Microblock) {
        const localStateUpdater = InternalStateUpdaterFactory.createApplicationInternalStateUpdater(microblock.getLocalStateUpdateVersion());
        return localStateUpdater.updateState(state, microblock);
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ApplicationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        const organizationId = this.localState.getOrganizationId();
        const organization = await this.provider.loadOrganizationVirtualBlockchain(organizationId);
        return await organization.getPublicKey();
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
        return this.localState.getOrganizationId()
    }
}
