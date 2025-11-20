import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {Microblock} from "../microblock/Microblock";
import {OrganizationVb} from "./OrganizationVb";
import {ApplicationLocalState} from "../localStates/ApplicationLocalState";
import {ApplicationDeclarationSection, ApplicationDescriptionSection} from "../../type/sections";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {
    ApplicationMicroblockStructureChecker
} from "../structureCheckers/ApplicationMicroblockStructureChecker";
import {Hash} from "../../entities/Hash";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";

export class ApplicationVb extends VirtualBlockchain {
    
    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider,  private state: ApplicationLocalState = ApplicationLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, new ApplicationMicroblockStructureChecker());
    }

    setLocalState(state: ApplicationLocalState) {
        this.state = state
    }


    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const localStateUpdater = LocalStateUpdaterFactory.createApplicationLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        this.state = localStateUpdater.updateState(this.state, microblock);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        const organizationId = this.state.getOrganizationId();
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
