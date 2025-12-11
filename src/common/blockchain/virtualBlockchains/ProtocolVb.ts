import {SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {Provider} from "../../providers/Provider";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {ProtocolMicroblockStructureChecker} from "../structureCheckers/ProtocolMicroblockStructureChecker";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Microblock} from "../microblock/Microblock";
import {IProvider} from "../../providers/IProvider";
import {ProtocolInternalState} from "../internalStates/ProtocolInternalState";
import {InternalStateUpdaterFactory} from "../internalStatesUpdater/InternalStateUpdaterFactory";
import {ProtocolInternalStateUpdater} from "../internalStatesUpdater/ProtocolInternalStateUpdater";

export class ProtocolVb extends VirtualBlockchain<ProtocolInternalState> {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------

    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    constructor(provider: IProvider, state: ProtocolInternalState = ProtocolInternalState.createInitialState()) {
        super(provider, VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN, state);
    }

    protected checkMicroblockStructure(microblock: Microblock): boolean {
        const checker = new ProtocolMicroblockStructureChecker();
        return checker.checkMicroblockStructure(microblock);
    }

    protected async updateInternalState(protocolState: ProtocolInternalState, state:ProtocolInternalState, microblock: Microblock) {
        const stateUpdaterVersion = protocolState.getProtocolInternalStateUpdaterVersion();
        const localStateUpdater = InternalStateUpdaterFactory.createProtocolInternalStateUpdater(
            stateUpdaterVersion
        );
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



}
