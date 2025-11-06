import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {StructureChecker} from "./StructureChecker";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {Crypto} from "../crypto/crypto";
import {StringSignatureEncoder} from "../crypto/signature/signature-encoder";
import {Provider} from "../providers/Provider";
import {MicroblockSection, OrganizationDescription, OrganizationVBState} from "./types";
import {Section} from "./Microblock";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";

export class OrganizationVb extends VirtualBlockchain<OrganizationVBState> {
    private signatureEncoder = StringSignatureEncoder.defaultStringSignatureEncoder();
    constructor({
            provider
        }: { provider: Provider }) {
        super({ provider, type: CHAIN.VB_ORGANIZATION });

        this.registerSectionCallback(SECTIONS.ORG_SIG_SCHEME, this.signatureSchemeCallback);
        this.registerSectionCallback(SECTIONS.ORG_PUBLIC_KEY, this.publicKeyCallback);
        this.registerSectionCallback(SECTIONS.ORG_DESCRIPTION, this.descriptionCallback);
        this.registerSectionCallback(SECTIONS.ORG_SIGNATURE, this.signatureCallback);
    }

    /**
     Update methods
     */
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
     */
    async setDescription(object: OrganizationDescription) {
        await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
    }

    /**
     *
     * @param {PrivateSignatureKey} privateKey
     * @returns {Promise<void>}
     */
    async setSignature(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.ORG_SIGNATURE, object);
    }

    /**
     Section callbacks
     */
    async signatureSchemeCallback(microblock: any, section: any) {
        this.getState().signatureSchemeId = section.object.schemeId;
    }

    async publicKeyCallback(microblock: any, section: any) {
        this.getState().publicKeyHeight = microblock.header.height;
    }

    async descriptionCallback(microblock: any, section: any) {
        this.getState().descriptionHeight = microblock.header.height;
    }

    async signatureCallback(microblock: any, section: any) {
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

    getDescriptionHeight(): number {
        return this.getState().descriptionHeight;
    }

    async getPublicKey(): Promise<PublicSignatureKey> {
        const keyMicroblock = await this.getMicroblock(this.getState().publicKeyHeight);
        const rawPublicKey = keyMicroblock.getSection((section: any) => section.type == SECTIONS.ORG_PUBLIC_KEY).object.publicKey;
        const cryptoFactory = new CryptoSchemeFactory();
        const signatureSchemeId = this.getState().signatureSchemeId;
        const publicKey = cryptoFactory.createPublicSignatureKey(signatureSchemeId, rawPublicKey)

        return publicKey;
    }

    /**
     Structure check
     */
    checkStructure(microblock: any) {
        const checker = new StructureChecker(microblock);

        checker.expects(
            checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.ZERO,
            SECTIONS.ORG_SIG_SCHEME
        );
        checker.expects(
            checker.isFirstBlock() ? SECTIONS.ONE : SECTIONS.AT_MOST_ONE,
            SECTIONS.ORG_PUBLIC_KEY
        );
        checker.group(
            SECTIONS.AT_LEAST_ONE,
            [
                [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_DESCRIPTION ],
                [ SECTIONS.AT_MOST_ONE, SECTIONS.ORG_SERVER ]
            ]
        );
        checker.expects(SECTIONS.ONE, SECTIONS.ORG_SIGNATURE);
        checker.endsHere();
    }

    private static UNDEFINED_SIGNATURE_SCHEME_ID = -1;
    private static UNDEFINED_PUBLIC_KEY_HEIGHT = 0;
    private static UNDEFINED_DESCRIPTION_HEIGHT = 0;

    protected getInitialState(): OrganizationVBState {
        return {
            signatureSchemeId: OrganizationVb.UNDEFINED_SIGNATURE_SCHEME_ID,
            publicKeyHeight: OrganizationVb.UNDEFINED_PUBLIC_KEY_HEIGHT,
            descriptionHeight: OrganizationVb.UNDEFINED_DESCRIPTION_HEIGHT
        }
    }
}
