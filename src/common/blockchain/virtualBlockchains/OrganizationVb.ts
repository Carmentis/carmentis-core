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



    protected async updateLocalState(state: OrganizationInternalState, microblock: Microblock) {
        const localStateVersion = microblock.getLocalStateUpdateVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createOrganizationInternalStateUpdater(localStateVersion);
        return await localStateUpdater.updateState(state, microblock);
    }
    
    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new OrganizationMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock)
    }

    /**
     Update methods
     */
    /*
    async setSignatureScheme(signatureSchemeId: SignatureSchemeId) {
        await this.addSection(SECTIONS.ORG_SIG_SCHEME, {
            schemeId: signatureSchemeId
        });
    }

    async setPublicKey(publicKey: PublicSignatureKey) {
        await this.addSection(SECTIONS.ORG_PUBLIC_KEY, {
            publicKey: publicKey.getPublicKeyAsBytes()
        });
    }

    /**
     * Sets the description for the organization by adding a new section.
     *
     * @param {OrganizationDescription} object - The object containing the organization description details.
     * @return {Promise<void>} A promise that resolves when the description has been successfully set.
     *
    async setDescription(object: OrganizationDescription) {
        await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
    }

    /**
     *
     * @param {PrivateSignatureKey} privateKey
     * @returns {Promise<void>}
     *
    async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.ORG_SIGNATURE, object);
    }

     */

    /**
     Section callbacks
     */
    /*
    async signatureSchemeCallback(microblock: any, section: any) {
        this.getState().signatureSchemeId = section.object.schemeId;
    }

    async publicKeyCallback(microblock: any, section: any) {
        this.getState().publicKeyHeight = microblock.header.height;
    }

    async descriptionCallback(microblock: any, section: any) {
        this.getState().descriptionHeight = microblock.header.height;
    }

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

    async getPublicKey(): Promise<PublicSignatureKey> {
        const publicKeyDefinitionHeight = this.localState.getPublicKeyDefinitionHeight();
        const publicSignatureKeySchemeId = this.localState.getPublicSignatureKeySchemeId();
        const keyMicroblock = await this.getMicroblock(publicKeyDefinitionHeight);
        const section = keyMicroblock.getOrganizationPublicKeySection();
        const rawPublicKey = section.object.publicKey;
        const cryptoFactory = new CryptoSchemeFactory();
        const publicKey = cryptoFactory.createPublicSignatureKey(publicSignatureKeySchemeId, rawPublicKey)
        return publicKey;
    }

    async getDescription() : Promise<OrganizationDescriptionSection> {
        const descriptionHeight = this.localState.getDescriptionHeight();
        const microblock = await this.getMicroblock(descriptionHeight);
        const section = microblock.getOrganizationDescriptionSection();
        return section.object;
    }

}
