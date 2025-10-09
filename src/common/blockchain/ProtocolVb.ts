import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {StructureChecker} from "./StructureChecker";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Crypto} from "../crypto/crypto";
import {PrivateSignatureKey, PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../crypto/signature/signature-encoder";
import {Provider} from "../providers/Provider";
import {MicroblockSection, ProtocolVBState} from "./types";
import {Section} from "./Microblock";

export class ProtocolVb extends VirtualBlockchain<ProtocolVBState> {
    private signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
    constructor({
            provider
        }: { provider: Provider }) {
        super({ provider, type: CHAIN.VB_PROTOCOL });
    }

    async setSignatureAlgorithm(signatureAlgorithmId: SignatureAlgorithmId) {
        await this.addSection(SECTIONS.PROTOCOL_SIG_ALGORITHM, {
            algorithmId: signatureAlgorithmId
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

    async getPublicKey(): Promise<PublicSignatureKey> {
        const keyMicroblock = await this.getMicroblock(this.getState().publicKeyHeight);
        const rawPublicKey = keyMicroblock.getSection((section: any) => section.type == SECTIONS.PROTOCOL_PUBLIC_KEY).object.publicKey;
        const cryptoFactory = new CryptoSchemeFactory();
        const signatureAlgorithmId = this.getState().signatureAlgorithmId;
        const publicKey = cryptoFactory.createPublicSignatureKey(signatureAlgorithmId, rawPublicKey)

        return publicKey;
    }

    checkStructure(microblock: any) {
        const checker = new StructureChecker(microblock);
    }
}
