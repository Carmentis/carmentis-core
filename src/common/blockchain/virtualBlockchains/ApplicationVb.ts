import {VirtualBlockchain} from "./VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Microblock} from "../microblock/Microblock";
import {ApplicationLocalState} from "../localStates/ApplicationLocalState";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {ApplicationMicroblockStructureChecker} from "../structureCheckers/ApplicationMicroblockStructureChecker";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";

export class ApplicationVb extends VirtualBlockchain<ApplicationLocalState> {
    
    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider,  state: ApplicationLocalState = ApplicationLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, state);
    }


    protected async updateLocalState(state: ApplicationLocalState, microblock: Microblock) {
        const localStateUpdater = LocalStateUpdaterFactory.createApplicationLocalStateUpdater(microblock.getLocalStateUpdateVersion());
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
     */


    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

}
