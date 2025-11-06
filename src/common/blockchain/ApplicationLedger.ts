import {SCHEMAS, SECTIONS} from "../constants/constants";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {SchemaValidator} from "../data/schemaValidator";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {ImportedProof, Proof} from "./types";
import {Section} from "./Microblock";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {RecordDescription} from "./RecordDescription";
import {Height} from "../entities/Height";
import {ProofVerificationFailedError, ProtocolError} from "../errors/carmentis-error";


import {HKDF} from "../crypto/kdf/HKDF";
import { ActorType } from "../constants/ActorType";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {AES256GCMSymmetricEncryptionKey} from "../crypto/encryption/symmetric-encryption/encryption-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {MlKemPrivateDecryptionKey} from "../crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";

export class ApplicationLedger {
    provider: any;
    private allowedSignatureSchemeIds: SignatureSchemeId[];
    private allowedPkeSchemeIds: PublicKeyEncryptionSchemeId[];
    vb: ApplicationLedgerVb;
    gasPrice: CMTSToken;

    constructor({
                    provider
                }: { provider: Provider }) {
        this.vb = new ApplicationLedgerVb({provider});
        this.provider = provider
        this.gasPrice = CMTSToken.zero();

        // by default, we allow all signature schemes and all PKE schemes, modeled by an empty list
        this.allowedSignatureSchemeIds = [];
        this.allowedPkeSchemeIds = [];
    }

    /**
     * Sets the list of allowed signature schemes by assigning the provided scheme IDs.
     *
     * @param {SignatureSchemeId[]} schemeIds - An array of signature scheme IDs that are allowed.
     * @return {void} This method does not return anything.
     */
    setAllowedSignatureSchemes(schemeIds: SignatureSchemeId[]) {
        this.allowedSignatureSchemeIds = schemeIds;
    }

    /**
     * Sets the allowed public key encryption schemes.
     *
     * @param {PublicKeyEncryptionSchemeId[]} schemeIds - An array of public key encryption scheme IDs to designate as allowed.
     * @return {void}
     */
    setAllowedPkeSchemes(schemeIds: PublicKeyEncryptionSchemeId[]) {
        this.allowedPkeSchemeIds = schemeIds;
    }

    /**
     * Retrieves the list of allowed signature scheme identifiers.
     *
     * @return {Array} An array containing the identifiers of the allowed signature schemes.
     */
    getAllowedSignatureSchemes() {
        return this.allowedSignatureSchemeIds;
    }

    /**
     * Retrieves the list of allowed public key encryption schemes.
     *
     * @return {Array} An array containing the identifiers of allowed public key encryption schemes.
     */
    getAllowedPkeSchemes() {
        return this.allowedPkeSchemeIds;
    }

    /**
     * Determines if the provided signature scheme ID is allowed.
     *
     * @param {SignatureSchemeId} schemeId - The ID of the signature scheme to check.
     * @return {boolean} True if the signature scheme ID is allowed, otherwise false.
     */
    isAllowedSignatureScheme(schemeId: SignatureSchemeId) {
        return this.allowedSignatureSchemeIds.includes(schemeId);
    }

    /**
     * Checks if a given public key encryption scheme is allowed.
     *
     * @param {PublicKeyEncryptionSchemeId} schemeId - The ID of the public key encryption scheme to check.
     * @return {boolean} Returns true if the scheme is allowed, otherwise returns false.
     */
    isAllowedPkeScheme(schemeId: PublicKeyEncryptionSchemeId) {
        return this.allowedPkeSchemeIds.includes(schemeId);
    }

    getVirtualBlockchainId() {
        return Hash.from(this.vb.getId());
    }

    async getGenesisSeed() {
        return this.vb.getGenesisSeed();
    }

    /**
     * Returns the (unique) identifier associated with the name of the actor.
     * 
     * Note: Two actors cannot have the same name.
     *  
     * @param actorName The name of the actor from which we want to get the identifier.
     * @returns 
     */
    getActorIdFromActorName(actorName: string) {
        return this.vb.getActorId(actorName);
    }

    /**
     * Subscribes an actor in the application ledger.
     * 
     * A subscription is used to associate public keys to an actor name (or identifier).
     * 
     * @param actorName The name of the actor subscribed on the application ledger.
     * @param actorPublicSignatureKey  The public signature key of the actor.
     * @param actorPublicEncryptionKey The public encryption key of the actor.
     * 
     * @returns 
     */
    subscribeActor(
        actorName: string,
        actorPublicSignatureKey: PublicSignatureKey,
        actorPublicEncryptionKey: AbstractPublicEncryptionKey,
    ) {
        const actorId = this.getActorIdFromActorName(actorName);

        // The actor type is currently not used in the protocol
        const unknownActorType = ActorType.UNKNOWN; 
        
        // The organization id is currently not used in the protocol. 
        // Initially, it has been designed to handle the case where a user from another organization is added to an external vb.
        const nullOrganizationId = Utils.getNullHash();
        
        return this.vb.subscribe({
            actorId,
            actorType: unknownActorType,
            organizationId: nullOrganizationId,
            signatureSchemeId: actorPublicSignatureKey.getSignatureSchemeId(),
            signaturePublicKey: actorPublicSignatureKey.getPublicKeyAsBytes(),
            pkeSchemeId: actorPublicEncryptionKey.getSchemeId(),
            pkePublicKey: actorPublicEncryptionKey.getRawPublicKey(),
        })
    }

    getVirtualBlockchain() {
        if (!this.vb) {
            throw new Error("Cannot return application ledger virtual blockchain: undefined virtual blockchain. ")
        }
        return this.vb;
    }

    async _create(applicationId: string) {
        if (!this.provider.isKeyed()) {
            throw 'Cannot create an application ledger without a keyed provider.'
        }
        await this.vb.setAllowedSignatureSchemes({
            schemeIds: this.allowedSignatureSchemeIds
        });
        await this.vb.setAllowedPkeSchemes({
            schemeIds: this.allowedPkeSchemeIds
        });
    }

    async _load(identifier: Uint8Array) {
        await this.vb.load(identifier);
    }

    async _processJson(object: RecordDescription) {
        const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
        validator.validate(object);

        // if there's a reference to an existing VB, load it
        if (object.virtualBlockchainId) {
            await this.vb.load(Utils.binaryFromHexa(object.virtualBlockchainId));
        }

        if (this.vb.height == 0) {
            // genesis -> declare the signature scheme and the application
            await this.vb.setAllowedSignatureSchemes({
                schemeIds: this.allowedSignatureSchemeIds
            });
            await this.vb.addDeclaration({
                applicationId: Utils.binaryFromHexa(object.applicationId)
            });
        }

        // add the new actors
        for (const def of object.actors || []) {
            await this.vb.createActor({
                id: this.vb.getNumberOfActors(),
                type: 0,
                name: def.name
            });
        }

        // get the author ID
        const authorId = this.vb.getActorId(object.author);

        // get the endorser ID
        const endorserId = object.endorser && this.vb.getActorId(object.endorser);

        // add the new channels
        for (const def of object.channels || []) {
            await this.vb.createChannel({
                id: this.vb.getNumberOfChannels(),
                isPrivate: !def.public,
                creatorId: authorId,
                name: def.name
            });
        }

        // initialize an IR object, set the channels and load the data
        const ir = this.vb.getIntermediateRepresentationInstance();

        ir.buildFromJson(object.data);

        // process field assignations
        for (const def of object.channelAssignations || []) {
            const channelId = this.vb.getChannelId(def.channelName);
            ir.setChannel(def.fieldPath, channelId);
        }

        // process actor assignations
        for (const def of object.actorAssignations || []) {
            const channelId = this.vb.getChannelId(def.channelName);
            const actorId = this.vb.getActorId(def.actorName);

            const hostId = authorId; // the host is the author (and in the current version of the protocol, this is the operator)
            const guestId = actorId; // the guest is the actor assigned to the channel

            // FIXME: get the private key, using the unified operator/wallet interface
            const hostPrivateDecryptionKey = MlKemPrivateDecryptionKey.genFromSeed(new Uint8Array(64));

            // To invite the actor in the channel, we first retrieve or generate a symmetric encryption key used to establish
            // secure communication between both peers. The key is then used to encrypt the channel key and put in a dedicated
            // section of the microblock.
            const hostGuestSharedKey =
                await this.getExistingSharedKey(hostId, guestId) ||
                await this.getExistingSharedKey(guestId, hostId) ||
                await this.createSharedKey(hostPrivateDecryptionKey, hostId, guestId);

            // we encrypt the channel key using the shared secret key
            const channelKey = await this.vb.getChannelKey(hostId, channelId);
            const encryptedChannelKey = hostGuestSharedKey.encrypt(channelKey);

            // we create the section containing the encrypted channel key (that can only be decrypted by the host and the guest)
            await this.vb.inviteToChannel({
                channelId,
                hostId,
                guestId,
                encryptedChannelKey,
            })
        }

        // process hashable fields
        for (const def of object.hashableFields || []) {
            ir.setAsHashable(def.fieldPath);
        }

        // process maskable fields
        for (const def of object.maskableFields || []) {
            const list = def.maskedParts.map((obj: any) => [obj.position, obj.position + obj.length, obj.replacementString]);
            ir.setAsMaskable(def.fieldPath, list);
        }

        // process channel data
        ir.serializeFields();
        ir.populateChannels();

        const channelDataList = ir.exportToSectionFormat();

        for (const channelData of channelDataList) {
            if (channelData.isPrivate) {
                const channelKey = await this.vb.getChannelKey(authorId, channelData.channelId);
                const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, this.vb.height + 1, channelData.channelId);
                const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, this.vb.height + 1, channelData.channelId);
                const encryptedData = Crypto.Aes.encryptGcm(channelSectionKey, channelData.data, channelSectionIv);

                await this.vb.addPrivateChannelData({
                    channelId: channelData.channelId,
                    // @ts-expect-error TS(2339): Property 'merkleRootHash' does not exist on type '... Remove this comment to see the full error message
                    merkleRootHash: Utils.binaryFromHexa(channelData.merkleRootHash),
                    encryptedData: encryptedData
                });
            } else {
                await this.vb.addPublicChannelData({
                    channelId: channelData.channelId,
                    data: channelData.data
                });
            }
        }
        console.log(this.vb);
    }

    /**
     * Retrieves an existing shared key between two peers, or undefined.
     */
    async getExistingSharedKey(hostId: number, guestId: number) {
        const guestActor = this.getActorByIdOrFail(guestId);
        const sharedSecretFromState = guestActor.sharedSecrets.find((object) =>
            object.peerActorId == hostId
        );

        if(sharedSecretFromState === undefined) {
            return undefined;
        }

        const microBlock = await this.vb.getMicroblock(sharedSecretFromState.height);

        const sharedSecretSection = microBlock.getSection((section: any) =>
            section.type == SECTIONS.APP_LEDGER_SHARED_SECRET &&
            section.object.hostId == hostId &&
            section.object.guestId == guestId
        );

        if(sharedSecretSection === undefined) {
            throw new ProtocolError(`unable to find shared secret section`);
        }

        return sharedSecretSection.object.encryptedChannelKey;
    }

    /**
     * Creates a shared key between two peers.
     */
    async createSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, hostId: number, guestId: number) {
        const hostPrivateDecryptionKeyBytes = hostPrivateDecryptionKey.getRawPrivateKey();

        const salt = new Uint8Array();
        const vbGenesisSeed = await this.vb.getGenesisSeed();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("SHARED_SECRET"), vbGenesisSeed, guestId);
        const hkdf = new HKDF();
        const hostGuestSharedKeyBytes = hkdf.deriveKey(hostPrivateDecryptionKeyBytes, salt, info, 32);
        const hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(hostGuestSharedKeyBytes);

        // we encrypt the shared key with the guest's public key
        const guestPublicEncryptionKey = await this.getPublicEncryptionKeyByActorId(guestId);
        const encryptedSharedKey = guestPublicEncryptionKey.encrypt(hostGuestSharedKey.getRawSecretKey());

        // we create the section containing the shared secret key
        await this.vb.createSharedSecret({
            hostId,
            guestId,
            encryptedSharedKey,
        });

        return hostGuestSharedKey;
    }

    actorIsSubscribed(name: string) {
        const actor = this.vb.getActor(name);
        return actor.subscribed;
    }

    async getRecord<T = any>(height: Height) {
        const ir = await this.getMicroblockIntermediateRepresentation(height);
        return ir.exportToJson() as T;
    }

    async getRecordAtFirstBlock() {
        return this.getRecord(1);
    }

    /**
     * Exports a proof containing intermediate representations for all microblocks up to the current height of the virtual blockchain.
     *
     * @param {Object} customInfo - Custom information to include in the proof.
     * @param {string} customInfo.author - The author of the proof file.
     * @return {Promise<Object>} A promise that resolves to an object containing metadata and the exported proof data.
     * @return {Object} return.info - Metadata about the proof.
     * @return {string} return.info.title - A title describing the proof file.
     * @return {string} return.info.date - The date the proof was created, in ISO format.
     * @return {string} return.info.author - The author of the proof file.
     * @return {string} return.info.virtualBlockchainIdentifier - The identifier of the virtual blockchain.
     * @return {Array<Object>} return.proofs - An array of exported proof data for each microblock.
     * @return {number} return.proofs[].height - The height of the microblock.
     * @return {Object} return.proofs[].data - The proof data for the corresponding microblock.
     */
    async exportProof(customInfo: { author: string }): Promise<Proof> {
        const proofs = [];

        for (let height = 1; height <= this.vb.height; height++) {
            const ir = await this.getMicroblockIntermediateRepresentation(height);

            proofs.push({
                height: height,
                data: ir.exportToProof()
            });
        }

        const info = {
            title: "Carmentis proof file - Visit www.carmentis.io for more information",
            date: new Date().toJSON(),
            author: customInfo.author,
            virtualBlockchainIdentifier: Utils.binaryToHexa(this.vb.identifier)
        };

        return {
            info,
            proofs
        };
    }

    /**
     *
     * @param proofObject
     * @throws ProofVerificationFailedError
     */
    async importProof(proofObject: Proof): Promise<ImportedProof[]> {
        const data = [];

        for (let height = 1; height <= this.vb.height; height++) {
            const proof = proofObject.proofs.find((proof: any) => proof.height == height);
            const ir = await this.getMicroblockIntermediateRepresentation(height);
            const merkleData = ir.importFromProof(proof?.data);

            // TODO: check Merkle root hash
            const verified = true;
            if (!verified) {
                throw new ProofVerificationFailedError();
            }

            data.push({
                height,
                data: ir.exportToJson()
            });
        }
        return data;
    }

    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getPublicEncryptionKeyByActorId(actorId: number) {
        // recover the actor's public encryption key from the virtual blockchain state
        // and ensure that the public encryption key is defined
        const actor = this.getActorByIdOrFail(actorId);
        const actorPublicKeyEncryptionHeightDefinition = actor.pkeKeyHeight;
        if (actorPublicKeyEncryptionHeightDefinition === undefined) {
            throw new ProtocolError(`Actor ${actorId} has not subscribed to a public encryption key.`)
        }

        // search the microblock containing the actor subscription (and the public encryption key definition)
        const microBlock = await this.vb.getMicroblock(actorPublicKeyEncryptionHeightDefinition);
        const subscribeSection = microBlock.getSection((section: any) =>
            section.type == SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION &&
            section.object.actorId == actorId
        );

        // reconstruct the public encryption key
        const rawPkePublicKey = subscribeSection.object.pkePublicKey;
        const pkeSchemeId = subscribeSection.object.pkeSchemeId;
        return CryptoSchemeFactory.createPublicEncryptionKey(pkeSchemeId, rawPkePublicKey);
    }

    private getActorByIdOrFail(actorId: number) {
        const state = this.vb.getState();
        const allActors = state.actors;

        // we first check if the actor identifier is valid
        if (actorId < 0 || actorId >= allActors.length) {
            throw new Error(`Actor with id ${actorId} does not exist.`);
        }

        // we then check if the actor is defined (in practice, this test should never fail, but we never know...)
        const actor = state.actors[actorId];
        if (actor === undefined || actor === null) {
            throw new ProtocolError(`Actor with id ${actorId} is not defined.`);
        }

        return actor;
    }

    async getMicroblockIntermediateRepresentation(height: number) {
        const microblock = await this.vb.getMicroblock(height);
        const publicChannelDataSections = microblock.getSections((section: any) => section.type == SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA);
        const privateChannelDataSections = microblock.getSections((section: any) => section.type == SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA);
        const ir = this.vb.getIntermediateRepresentationInstance();

        const list: { channelId: number, data: object, merkleRootHash?: string }[] =
            publicChannelDataSections.map((section: Section<{ channelId: number, data: object }>) => {
                return {
                    channelId: section.object.channelId,
                    data: section.object.data
                };
            });

        for(const section of privateChannelDataSections) {
            const channelKey = await this.vb.getChannelKey(await this.vb.getCurrentActorId(), section.object.channelId);
            const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, height, section.object.channelId);
            const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, height, section.object.channelId);
            const data = Crypto.Aes.decryptGcm(channelSectionKey, section.object.encryptedData, channelSectionIv);

            list.push({
                channelId: section.object.channelId,
                merkleRootHash: Utils.binaryToHexa(section.object.merkleRootHash),
                data: data as Uint8Array
            });
        }

        ir.importFromSectionFormat(list);
        return ir;
    }

    setGasPrice(gasPrice: CMTSToken) {
        this.gasPrice = gasPrice;
    }

    getMicroblockData() {
        return this.vb.getMicroblockData();
    }

    /**
     * Retrieves the application ID.
     *
     * @return {Hash} The hashed application ID obtained from the underlying system.
     */
    getApplicationId() {
        return Hash.from(this.vb.getApplicationId());
    }

    getHeight(): number {
        return this.vb.height;
    }

    async publishUpdates(waitForAnchoring : boolean = true) {
        if (!this.provider.isKeyed()) {
            throw 'Cannot publish updates without keyed provider.'
        }
        const privateKey = this.provider.getPrivateSignatureKey();
        this.vb.setGasPrice(this.gasPrice);
        await this.vb.signAsAuthor(privateKey);
        return await this.vb.publish(waitForAnchoring);
    }


    /**
     * Returns the list of created actors (name of the actor and its public key, if any).
     * @param height
     */
    async getCreatedActorsAtHeight(height: Height) {
        // TODO implement method to list created actors
    }

    async getAuthorSignature(height: Height) {
        // TODO implement method to get author signature
    }

    async getEndorserSignature(height: Height) {
        // TODO implement method to get endorser signature
    }

    async getAuthorPublicKey(height: Height) {
        // TODO implement method to get author public key
    }

    async getEndorserPublicKey(height: Height) {
        // TODO implement method to get endorser public key
    }

    async getActorPublicKeys(actorName: string) {

    }

    async getActorNameByPublicKey(publicKey: PublicSignatureKey) {

    }
}
