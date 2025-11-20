import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {ProtocolMicroblockStructureChecker} from "../structureCheckers/ProtocolMicroblockStructureChecker";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {ProtocolLocalState} from "../localStates/ProtocolLocalState";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {Microblock} from "../microblock/Microblock";

export class ProtocolVb extends VirtualBlockchain<ProtocolLocalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: Provider, state: ProtocolLocalState = ProtocolLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN, state);
    }

    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ProtocolMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    protected async updateLocalState(state:ProtocolLocalState, microblock: Microblock) {
        const localStateUpdater = LocalStateUpdaterFactory.createProtocolLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        return localStateUpdater.updateState(state, microblock);
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
        const keyMicroblock = await this.getMicroblock(this.localState.getLocalState().publicKeyHeight);
        const rawPublicKey = keyMicroblock.getSection((section) => section.type == SECTIONS.PROTOCOL_PUBLIC_KEY).object.publicKey;
        const cryptoFactory = new CryptoSchemeFactory();
        const signatureSchemeId = this.localState.getLocalState().signatureSchemeId;
        const publicKey = cryptoFactory.createPublicSignatureKey(signatureSchemeId, rawPublicKey)

        return publicKey;
    }

    async signatureCallback(microblock: Microblock, section: any) {
        const publicKey = await this.getPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

}
