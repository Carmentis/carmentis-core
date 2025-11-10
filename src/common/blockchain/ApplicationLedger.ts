import {SCHEMAS, SECTIONS} from "../constants/constants";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {SchemaValidator} from "../data/schemaValidator";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";
import {Provider} from "../providers/Provider";
import {
    ApplicationLedgerPrivateChannelDataSection,
    ApplicationLedgerPublicChannelDataSection,
    ImportedProof,
    Proof
} from "./types";
import {Section} from "./Microblock";
import {Hash} from "../entities/Hash";
import {CMTSToken} from "../economics/currencies/token";
import {RecordDescription} from "./RecordDescription";
import {Height} from "../entities/Height";
import {
    DecryptionError, IllegalParameterError,
    NoSharedSecretError,
    ProofVerificationFailedError,
    ProtocolError, SharedKeyDecryptionError
} from "../errors/carmentis-error";


import {HKDF} from "../crypto/kdf/HKDF";
import {ActorType} from "../constants/ActorType";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {
    AES256GCMSymmetricEncryptionKey,
    SymmetricEncryptionKey
} from "../crypto/encryption/symmetric-encryption/encryption-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {MlKemPrivateDecryptionKey} from "../crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";

export class ApplicationLedger {
    provider: any;
    private allowedSignatureSchemeIds: SignatureSchemeId[];
    private allowedPkeSchemeIds: PublicKeyEncryptionSchemeId[];
    vb: ApplicationLedgerVb;
    gasPrice: CMTSToken;

    constructor({provider}: { provider: Provider }) {
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

    async _processJson(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, object: RecordDescription) {
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
        const ir = this.vb.getChannelSpecializedIntermediateRepresentationInstance();
        ir.buildFromJson(object.data);

        // process field assignations
        for (const def of object.channelAssignations || []) {
            const channelId = this.vb.getChannelIdByChannelName(def.channelName);
            ir.setChannel(def.fieldPath, channelId);
        }

        // process actor assignations
        // Note: we do not verify that the guest is already in the channel, this is verified in the callback during
        // section verifications.
        for (const def of object.actorAssignations || []) {
            const channelId = this.vb.getChannelIdByChannelName(def.channelName);
            const actorId = this.vb.getActorId(def.actorName);

            const hostId = authorId; // the host is the author (and in the current version of the protocol, this is the operator)
            const guestId = actorId; // the guest is the actor assigned to the channel

            // To invite the actor in the channel, we first retrieve or generate a symmetric encryption key used to establish
            // secure communication between both peers. The key is then used to encrypt the channel key and put in a dedicated
            // section of the microblock.
            const hostGuestEncryptedSharedKey =
                await this.getExistingSharedKey(hostId, guestId) ||
                await this.getExistingSharedKey(guestId, hostId);


            // if we have found the (encrypted) shared secret key, then we *attempt* to decrypt it, otherwise
            // there is no shared secret key and then we create a new one
            let hostGuestSharedKey: AES256GCMSymmetricEncryptionKey;
            if (hostGuestEncryptedSharedKey !== undefined) {
                try {
                    hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(
                        hostPrivateDecryptionKey.decrypt(hostGuestEncryptedSharedKey)
                    );
                } catch (e) {
                    if (e instanceof DecryptionError) {
                        throw new SharedKeyDecryptionError("Cannot decrypt the shared key with the provided decryption key: Have you provided the valid one?")
                    } else {
                        throw e;
                    }
                }
            } else {
                hostGuestSharedKey = await this.createSharedKey(hostPrivateDecryptionKey, hostId, guestId);
            }


            // we encrypt the channel key using the shared secret key
            const channelKey = await this.vb.getChannelKey(hostId, channelId, hostPrivateDecryptionKey);
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
        //ir.serializeFields();
        //ir.populateChannels();
        ir.finalizeChannelData();

        const channelDataList = ir.exportToSectionFormat();
        for (const channelData of channelDataList) {
            if (channelData.isPrivate) {
                const channelKey = await this.vb.getChannelKey(authorId, channelData.channelId, hostPrivateDecryptionKey);
                const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, this.vb.height + 1, channelData.channelId);
                const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, this.vb.height + 1, channelData.channelId);
                const encryptedData = Crypto.Aes.encryptGcm(channelSectionKey, channelData.data, channelSectionIv);

                await this.vb.addPrivateChannelData({
                    channelId: channelData.channelId,
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

        // the endorser (the user approving the transaction) is optional, for instance during direct anchoring
        // request coming from the operator. In this case, the endorser is missing. Otherwise, when included,
        // we have to add a section declaring the message to show on the wallet.
        if (typeof object.endorser === 'string') {
            // we reject the request if the endorser is empty
            const endorserName = object.endorser;
            if (endorserName.trim().length === 0) throw new IllegalParameterError("Empty endorser provided: should be a non-empty string or undefined");

            // sometimes, there is no message to show (not provided by the application server). In this case,
            // we replace the message with an empty string.
            const endorserId = this.vb.getActorId(object.endorser);
            const messageToShow = object.approvalMessage ?? "";
            await this.vb.addEndorsementRequest(endorserId, messageToShow)
        }
    }

    /**
     * Retrieves an existing shared key between two peers, or undefined.
     */
    private async getExistingSharedKey(hostId: number, guestId: number): Promise<Uint8Array | undefined> {
        // search the guest actor associated with the provided guest id
        const guestActor = this.getActorByIdOrFail(guestId);

        // we search in the state the height of the microblock where the (encrypted) shared key is declared
        const sharedSecretFromState = guestActor.sharedSecrets.find(
            (object) => object.peerActorId == hostId
        );

        // if no shared secret is defined, then return undefined
        if (sharedSecretFromState === undefined) {
            return undefined;
        }

        // search the section declaring the (encrypted) shared key in the microblock specified in the state.
        const microBlock = await this.vb.getMicroblock(sharedSecretFromState.height);
        const sharedSecretSection = microBlock.getSection((section: any) =>
            section.type == SECTIONS.APP_LEDGER_SHARED_SECRET &&
            section.object.hostId == hostId &&
            section.object.guestId == guestId
        );

        // if the condition is verified, then there is a shared secret section in the vb declaring
        // a shared secret between guest and host but no shared key is included in the section: very very bad!
        if (sharedSecretSection === undefined) {
            throw new NoSharedSecretError(guestId, hostId);
        }

        return sharedSecretSection.object.encryptedChannelKey;
    }

    /**
     * Creates a shared key between two peers.
     */
    private async createSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, hostId: number, guestId: number) {
        const hostPrivateDecryptionKeyBytes = hostPrivateDecryptionKey.getRawPrivateKey();

        const vbGenesisSeed = await this.vb.getGenesisSeed();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("SHARED_SECRET"), vbGenesisSeed, guestId);
        const hkdf = new HKDF();
        const hostGuestSharedKeyBytes = hkdf.deriveKeyNoSalt(hostPrivateDecryptionKeyBytes, info, 32);
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

    async getRecord<T = any>(height: Height, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey) {
        const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);
        return ir.exportToJson() as T;
    }

    async getRecordAtFirstBlock(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey) {
        return this.getRecord(1, hostPrivateDecryptionKey);
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
    async exportProof(customInfo: {
        author: string
    }, hostPrivateDecryptionKey: AbstractPrivateDecryptionKey): Promise<Proof> {
        const proofs = [];

        for (let height = 1; height <= this.vb.height; height++) {
            const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);

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
     * @param hostPrivateDecryptionKey
     * @throws ProofVerificationFailedError Occurs when the provided proof is not verified.
     */
    async importProof(proofObject: Proof, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey): Promise<ImportedProof[]> {
        const data: ImportedProof[] = [];

        for (let height = 1; height <= this.vb.height; height++) {
            const proof = proofObject.proofs.find((proof: any) => proof.height == height);
            const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);
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

    async getMicroblockIntermediateRepresentation(height: number, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey) {
        const microblock = await this.vb.getMicroblock(height);
        const listOfChannels: { channelId: number, data: object, merkleRootHash?: string }[] = [];

        // we load the public channels that should be always accessible
        const publicChannelDataSections = microblock.getSections<ApplicationLedgerPublicChannelDataSection>(
            (section: any) => section.type == SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA
        );
        publicChannelDataSections.map((section) => {
            return {
                channelId: section.object.channelId,
                data: section.object.data
            };
        });

        // we now load private channels that might be protected (encrypted)
        if (hostPrivateDecryptionKey !== undefined) {
            const privateChannelDataSections = microblock.getSections<ApplicationLedgerPrivateChannelDataSection>(
                (section: any) => section.type == SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA
            );

            for (const section of privateChannelDataSections) {
                const { channelId, encryptedData, merkleRootHash } = section.object;
                try {
                    const channelKey = await this.vb.getChannelKey(await this.vb.getCurrentActorId(), channelId, hostPrivateDecryptionKey);
                    const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, height, channelId);
                    const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, height, channelId);
                    const data = Crypto.Aes.decryptGcm(channelSectionKey, encryptedData, channelSectionIv);

                    listOfChannels.push({
                        channelId: channelId,
                        merkleRootHash: Utils.binaryToHexa(merkleRootHash),
                        data: data as Uint8Array
                    });
                } catch (e) {
                    if (e instanceof DecryptionError) {
                        console.warn(`Not allowed to access channel ${channelId}`)
                    } else {
                        throw e;
                    }
                }
            }
        } else {
            console.warn("No private channel loaded: no private decryption key provided.")
        }

        // import the channels to the intermediate representation
        const ir = this.vb.getChannelSpecializedIntermediateRepresentationInstance();
        ir.importFromSectionFormat(listOfChannels);
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

    async publishUpdates(waitForAnchoring: boolean = true) {
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
