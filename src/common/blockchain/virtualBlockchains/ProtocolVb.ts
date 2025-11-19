import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {ProtocolMicroblockStructureChecker} from "../structureCheckers/ProtocolMicroblockStructureChecker";
import {VirtualBlockchainType} from "../../entities/VirtualBlockchainType";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {Microblock} from "../microblock/Microblock";
import {Hash} from "../../entities/Hash";

export class ProtocolVb extends VirtualBlockchain {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static async loadProtocolVirtualBlockchain(provider: Provider, protocolId: Hash) {
        const vb = new ProtocolVb(provider);
        await vb.synchronizeVirtualBlockchainFromProvider(protocolId);
        const state = await provider.getProtocolLocalStateFromId(protocolId)
        vb.setLocalState(state);
        return vb;
    }

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider, private state: ProtocolLocalState = ProtocolLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN, new ProtocolMicroblockStructureChecker());
    }

    protected setLocalState(state: ProtocolLocalState) {
        this.state = state
    }

    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const localStateUpdater = LocalStateUpdaterFactory.createProtocolLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        this.state = await localStateUpdater.updateState(this.state, microblock);
    }

    /**
     Update methods
     */
    /*
    async setSignatureScheme(signatureSchemeId: SignatureSchemeId) {
        await this.addSection(SECTIONS.PROTOCOL_SIG_SCHEME, {
            schemeId: signatureSchemeId
        });
    }

    async setPublicKey(publicKey: PublicSignatureKey) {
        await this.addSection(SECTIONS.PROTOCOL_PUBLIC_KEY, {
            publicKey: publicKey.getPublicKeyAsBytes()
        });
    }

    async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.PROTOCOL_SIGNATURE, object);
    }
     */


    async getPublicKey(): Promise<PublicSignatureKey> {
        const keyMicroblock = await this.getMicroblock(this.state.getLocalState().publicKeyHeight);
        const rawPublicKey = keyMicroblock.getSection((section) => section.type == SECTIONS.PROTOCOL_PUBLIC_KEY).object.publicKey;
        const cryptoFactory = new CryptoSchemeFactory();
        const signatureSchemeId = this.state.getLocalState().signatureSchemeId;
        const publicKey = cryptoFactory.createPublicSignatureKey(signatureSchemeId, rawPublicKey)

        return publicKey;
    }

    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

}
