import {SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Organization} from "./Organization";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {ApplicationVBState} from "./types";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {Microblock} from "./Microblock";
import {OrganizationVb} from "./OrganizationVb";
import {ApplicationLocalState} from "../blockchainV2/localStates/ApplicationLocalState";
import {ApplicationDeclarationSection, ApplicationDescriptionSection} from "./sectionSchemas";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {
    ApplicationMicroblockStructureChecker
} from "../blockchainV2/structureChekers/ApplicationMicroblockStructureChecker";
import {Hash} from "../entities/Hash";
import {OrganizationLocalState} from "../blockchainV2/localStates/OrganizationLocalState";
import {LocalStateUpdaterFactory} from "../blockchainV2/localStatesUpdater/LocalStateUpdaterFactory";

export class ApplicationVb extends VirtualBlockchain {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static async loadApplicationVirtualBlockchain(provider: Provider, applicationId: Hash) {
        const vb = new ApplicationVb(provider);
        await vb.synchronizeVirtualBlockchainFromProvider(applicationId);
        const state = await provider.getApplicationLocalStateFromId(applicationId)
        vb.setLocalState(state);
        return vb;
    }

    static createOrganizationVirtualBlockchain(provider: Provider) {
        return new OrganizationVb(provider);
    }

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider,  private state: ApplicationLocalState = ApplicationLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN, new ApplicationMicroblockStructureChecker());
    }

    protected setLocalState(state: ApplicationLocalState) {
        this.state = state
    }


    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const localStateUpdater = LocalStateUpdaterFactory.createApplicationLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        this.state = localStateUpdater.updateState(this.state, microblock);
    }

    async getOrganizationPublicKey(): Promise<PublicSignatureKey> {
        const organizationId = this.state.getOrganizationId();
        const organization = await OrganizationVb.loadOrganizationVirtualBlockchain(this.provider, organizationId);
        return await organization.getPublicKey();
    }

    /**
     Update methods
     */
    async setSignatureScheme(object: any) {
        await this.addSection(SECTIONS.APP_SIG_SCHEME, object);
    }

    async setDeclaration(object: ApplicationDeclarationSection) {
        await this.addSection(SECTIONS.APP_DECLARATION, object);
    }

    async setDescription(object: ApplicationDescriptionSection) {
        await this.addSection(SECTIONS.APP_DESCRIPTION, object);
    }


    /**
     *
     * @param {PrivateSignatureKey} privateKey
     * @returns {Promise<void>}
     */
    async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.APP_SIGNATURE, object);
    }


    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

}
