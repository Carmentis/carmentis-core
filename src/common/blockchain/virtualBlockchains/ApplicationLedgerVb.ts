import {SCHEMAS, SECTIONS} from "../../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {HKDF} from "../../crypto/kdf/HKDF";
import {ImportedProof, Proof} from "../../type/types";
import {IntermediateRepresentation} from "../../records/intermediateRepresentation";
import {Provider} from "../../providers/Provider";
import {Utils} from "../../utils/utils";

import {
    ActorNotInvitedError,
    CurrentActorNotFoundError,
    DecryptionError,
    IllegalParameterError,
    MicroBlockNotFoundInVirtualBlockchainAtHeightError,
    NoSharedSecretError,
    ProofVerificationFailedError,
    ProtocolError,
    SectionNotFoundError,
    SharedKeyDecryptionError,
} from "../../errors/carmentis-error";
import {Microblock} from "../microblock/Microblock";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {Logger} from "../../utils/Logger";
import {Crypto} from "../../crypto/crypto";
import {Assertion} from "../../utils/Assertion";
import {CryptoEncoderFactory} from "../../crypto/CryptoEncoderFactory";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {
    ApplicationLedgerMicroblockStructureChecker
} from "../structureCheckers/ApplicationLedgerMicroblockStructureChecker";
import {
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerActorSubscriptionSection,
    ApplicationLedgerChannelInvitationSection,
    ApplicationLedgerSharedKeySection
} from "../../type/sections";
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Hash} from "../../entities/Hash";
import {ActorType} from "../../constants/ActorType";
import {Height} from "../../type/Height";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";
import {AppLedgerStateUpdateRequest} from "../../type/AppLedgerStateUpdateRequest";
import {SchemaValidator} from "../../data/schemaValidator";
import {SectionType} from "../../type/SectionType";
import {LocalStateUpdaterFactory} from "../localStatesUpdater/LocalStateUpdaterFactory";
import {ApplicationLedgerMicroblockBuilder} from "./ApplicationLedgerMicroblockBuilder";
import {Section} from "../../type/Section";

export class ApplicationLedgerVb extends VirtualBlockchain {

    // ------------------------------------------
    // Static methods
    // ------------------------------------------
    static async loadApplicationLedgerVirtualBlockchain(provider: Provider, appLedgerId: Hash) {
        const vb = new ApplicationLedgerVb(provider);
        await vb.synchronizeVirtualBlockchainFromProvider(appLedgerId);
        const state = await provider.getApplicationLedgerLocalStateFromId(appLedgerId)
        vb.setLocalState(state);
        return vb;
    }

    static createApplicationLedgerVirtualBlockchain(provider: Provider) {
        return new ApplicationLedgerVb(provider);
    }


    // ------------------------------------------
    // Instance implementation
    // ------------------------------------------
    private state: ApplicationLedgerLocalState;

    constructor(provider: Provider, state: ApplicationLedgerLocalState = ApplicationLedgerLocalState.createInitialState()) {
        super(provider, VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN, new ApplicationLedgerMicroblockStructureChecker())
        this.state = state;
    }

    /**
     * This method should be used to
     */
    createWorkingEnv() {
        return ApplicationLedgerMicroblockBuilder.createNewMicroblockFromVirtualBlockchain(this);
    }

    protected async updateLocalState(microblock: Microblock): Promise<void> {
        const stateUpdater = LocalStateUpdaterFactory.createApplicationLedgerLocalStateUpdater(microblock.getLocalStateUpdateVersion());
        this.state = await stateUpdater.updateState(this.state, microblock);
    }


    setLocalState(state: ApplicationLedgerLocalState) {
        this.state = state;
    }


    actorIsSubscribed(name: string) {
        const actor = this.getActor(name);
        return actor.subscribed;
    }


    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getActorIdByPublicSignatureKey(publicKey: PublicSignatureKey): Promise<number> {
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);

        const state = this.state;
        const publicKeyBytes = publicKey.getPublicKeyAsBytes();
        for (let actorId = 0; actorId < state.getNumberOfActors(); actorId++) {
            const actor = state.getActorById(actorId);
            logger.debug(`Search current actor id: loop index ${actorId}`)
            const isNotSubscribed = !actor.subscribed;
            if (isNotSubscribed) continue;

            try {
                const keyMicroblock = await this.getMicroblock(actor.signatureKeyHeight);
                const keySection = keyMicroblock.getSection((section: Section<ApplicationLedgerActorSubscriptionSection>) => {
                    // we search a section declaring an actor subscription
                    const isActorSubscriptionSection = section.type === SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION;
                    if (!isActorSubscriptionSection) return false;

                    // we search a section focusing the current actor
                    const {actorId: actorFocusedByThisSection} = section.object;
                    const isFocusingActorInTheLoop = actorFocusedByThisSection === actorId;
                    if (!isFocusingActorInTheLoop) return false;

                    // we now ensure that the public signature key declared in the section and used by the current user are matching
                    const {signaturePublicKey} = section.object;
                    const isMatchingPublicKeys = Utils.binaryIsEqual(section.object.signaturePublicKey, publicKeyBytes);
                    logger.debug(`Is public key matching for actor ${actor.name} (id ${actorId})? ${signaturePublicKey} and ${publicKeyBytes}: ${isMatchingPublicKeys}`);
                    return isMatchingPublicKeys
                });
                logger.debug(`Matching public signature key: {actor.name} (id ${actorId})`, {actor})
                if (keySection) {
                    return actorId;
                }
            } catch (e) {
                if (e instanceof MicroBlockNotFoundInVirtualBlockchainAtHeightError) {
                    // this case is okay for actors not being registered yet
                    logger.debug('{e}', {e})
                } else if (e instanceof SectionNotFoundError) {
                    // againt this error might occur if the user is not defined
                    logger.debug('{e}', {e})
                } else {
                    throw e;
                }
            }
        }

        logger.debug('Current actor not found')
        throw new CurrentActorNotFoundError();
    }

    /**
     * Retrieves the public encryption key of an actor by its identifier.
     *
     * @param actorId The identifier of the actor.
     * @returns The public encryption key of the actor.
     */
    async getPublicEncryptionKeyByActorId(actorId: number): Promise<AbstractPublicEncryptionKey> {
        // recover the actor's public encryption key from the virtual blockchain state
        // and ensure that the public encryption key is defined
        const actor = this.state.getActorById(actorId);
        const actorPublicKeyEncryptionHeightDefinition = actor.pkeKeyHeight;
        const isPkeDefined =
            typeof actorPublicKeyEncryptionHeightDefinition === 'number' &&
            actorPublicKeyEncryptionHeightDefinition !== 0;
        if (!isPkeDefined) {
            throw new ProtocolError(`Actor ${actorId} has not subscribed to a public encryption key.`)
        }

        // search the microblock containing the actor subscription (and the public encryption key definition)
        const microBlock = await this.getMicroblock(actorPublicKeyEncryptionHeightDefinition);
        const subscribeSection = microBlock.getSection((section: Section) =>
            section.type == SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION &&
            section.object.actorId == actorId
        );

        // reconstruct the public encryption key
        const rawPkePublicKey = subscribeSection.object.pkePublicKey;
        const pkeSchemeId = subscribeSection.object.pkeSchemeId;
        return CryptoSchemeFactory.createPublicEncryptionKey(pkeSchemeId, rawPkePublicKey);
    }




    /**
     * Retrieves an existing shared key between two peers, or undefined.
     */
    async getExistingSharedKey(hostId: number, guestId: number): Promise<Uint8Array | undefined> {
        // search the guest actor associated with the provided guest id
        const guestActor = this.state.getActorById(guestId);

        // we search in the state the height of the microblock where the (encrypted) shared key is declared
        const sharedSecretFromState = guestActor.sharedSecrets.find(
            (object) => object.peerActorId == hostId
        );

        // if no shared secret is defined, then return undefined
        if (sharedSecretFromState === undefined) {
            return undefined;
        }

        // search the section declaring the (encrypted) shared key in the microblock specified in the state.
        const microBlock = await this.getMicroblock(sharedSecretFromState.height);
        const sharedSecretSection = microBlock.getSection((section) =>
            section.type == SectionType.APP_LEDGER_SHARED_SECRET &&
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




    /*
    async signAsAuthor(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, object);
    }

    async signAsEndorser(privateKey: PrivateSignatureKey) {
        const object = this.createSignature(privateKey);
        await this.addSection(SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE, object);
        return object.signature
    }

    async addEndorserSignature(signature: Uint8Array) {
        return this.addSection(SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE, {signature})
    }

     */

    /*
    async addEndorsementRequest(endorserId: number, messageToDisplay: string) {
        const section: ApplicationLedgerEndorsementRequestSection = {
            endorserId,
            message: messageToDisplay
        };
        return this.addSection(SECTIONS.APP_LEDGER_ENDORSEMENT_REQUEST, section)
    }

     */




    getChannelIdByChannelName(channelName: string) {
        return this.state.getChannelIdFromChannelName(channelName)
    }


    private getActorNameById(actorId: number) {
        const actor = this.state.getActorById(actorId);
        return actor.name;
    }

    getChannelNameById(channelId: number) {
        const channel = this.state.getChannelFromChannelId(channelId);
        return channel.name;
    }

    getActorIdFromActorName(name: string) {
        return this.state.getActorIdByName(name);
    }

    getActor(name: string) {
        return this.state.getActorByName(name);
    }


    async getOrganizationId(): Promise<Hash> {
        const applicationId = this.getApplicationId();
        const applicationLocalState = await this.provider.getApplicationLocalStateFromId(applicationId);
        const orgId = applicationLocalState.getOrganizationId();
        return orgId;
    }


    /**
     * Retrieves the application ID from the current state.
     *
     * @return {Hash} The application ID.
     */
    getApplicationId(): Hash {
        return this.state.getApplicationId();
    }

    /**
     * Retrieves the total number of channels currently available.
     *
     * @return {number} The number of channels.
     */
    getNumberOfChannels(): number {
        return this.state.getNumberOfChannels();
    }

    /**
     * Retrieves a channel object by its unique identifier.
     *
     * @param {number} channelId - The unique identifier of the channel
     */
    getChannelById(channelId: number) {
        return this.state.getChannelFromChannelId(channelId);
    }

    /**
     * Retrieves the total number of actors currently present in the state.
     *
     * @return {number} The number of actors.
     */
    getNumberOfActors(): number {
        return this.state.getNumberOfActors()
    }

    private async getMicroblockIntermediateRepresentation(height: number, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey) {
        const microblock = await this.getMicroblock(height);
        const listOfChannels: { channelId: number, data: object, merkleRootHash?: string }[] = [];

        // we load the public channels that should be always accessible
        const publicChannelDataSections = microblock.getPublicChannelDataSections();
        for (const publicChannelSection of publicChannelDataSections) {
            const {channelId, data} = publicChannelSection.object;
            listOfChannels.push({
                channelId: channelId,
                data: data
            });
        }


        // we now load private channels that might be protected (encrypted)
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);
        if (hostPrivateDecryptionKey instanceof AbstractPrivateDecryptionKey) {
            try {
                // we attempt to identify the current actor
                const currentActorId = await this.getActorIdAssociatedWithKeyInProvider();
                const privateChannelDataSections = microblock.getPrivateChannelDataSections();
                for (const section of privateChannelDataSections) {
                    const {channelId, encryptedData, merkleRootHash} = section.object;
                    try {
                        const channelKey = await this.getChannelKey(currentActorId, channelId, hostPrivateDecryptionKey);
                        const channelSectionKey = this.deriveChannelSectionKey(channelKey, height, channelId);
                        const channelSectionIv = this.deriveChannelSectionIv(channelKey, height, channelId);
                        const data = Crypto.Aes.decryptGcm(channelSectionKey, encryptedData, channelSectionIv);
                        // TODO: might need to move on the decryptGcm method
                        if (data === false) throw new DecryptionError("Failed to decrypt encrypted section data");

                        logger.debug(`Allowed to access private channel {channelName} (channel id={channelId})`, () => ({
                            channelName: this.getChannelNameById(channelId),
                            channelId
                        }))

                        listOfChannels.push({
                            channelId: channelId,
                            merkleRootHash: Utils.binaryToHexa(merkleRootHash),
                            data: data as Uint8Array
                        });
                    } catch (e) {
                        if (e instanceof DecryptionError || e instanceof ActorNotInvitedError) {
                            //console.warn(`Not allowed to access channel ${channelId}`)
                            logger.debug(`Access to private channel {channelName} forbidden (channel id={channelId}): {e}`, () => ({
                                e,
                                channelName: this.getChannelNameById(channelId),
                                channelId
                            }))
                        } else {
                            throw e;
                        }
                    }
                }
            } catch (e) {
                if (e instanceof CurrentActorNotFoundError) {
                    // This case occurs when the current actor is not found in the application ledger
                    // which happen when an external actor attempts to read the content of the application ledger.
                    const logger = Logger.getLogger([ApplicationLedgerVb.name]);
                    logger.debug("Unabled to recover private channels: {e}", {e})
                } else {
                    throw e;
                }
            }

        } else {
            console.warn("No private channel loaded: no private decryption key provided.")
        }

        // import the channels to the intermediate representation
        const ir = this.getChannelSpecializedIntermediateRepresentationInstance();
        ir.importFromSectionFormat(listOfChannels);
        return ir;
    }


    deriveChannelSectionKey(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, "CHANNEL_SECTION_KEY", height, channelId, 32);
    }

    deriveChannelSectionIv(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, "CHANNEL_SECTION_IV", height, channelId, 12);
    }




    deriveChannelSectionMaterial(channelKey: Uint8Array, prefix: string, height: number, channelId: number, keyLength: number) {
        const salt = new Uint8Array();
        const encoder = new TextEncoder;

        const info = Utils.binaryFrom(
            encoder.encode(prefix),
            channelId,
            new Uint8Array(Utils.intToByteArray(height, 6))
        );

        const hkdf = new HKDF();

        return hkdf.deriveKey(channelKey, salt, info, keyLength);
    }



    /**
     *
     * @param actorId
     * @param channelId
     * @param actorPrivateDecryptionKey
     *
     * @throws ActorNotInvitedError Occurs when no invitation of the actor has been found.
     * @throws NoSharedSecretError Occurs when no shared secret key has been found.
     * @throws DecryptionError Occurs when one of the encrypted channel key or encrypted shared key cannot be decrypted.
     */
    async getChannelKey(actorId: number, channelId: number, actorPrivateDecryptionKey: AbstractPrivateDecryptionKey) {
        // defensive programming
        Assertion.assert(typeof actorId === 'number', 'Expected actor id with type number')
        Assertion.assert(typeof channelId === 'number', `Expected channel id of type number: got ${typeof channelId}`)

        const logger = Logger.getLogger(['critical']);


        // if the actor id is the creator of the channel, then we have to derive the channel key locally...
        const state = this.state;
        const creatorId = state.getChannelCreatorIdFromChannelId(channelId);
        logger.debug('getChannelKey {data}', () => ({
            data: {
                state,
                actorId,
                creatorId,
                channelId,
                actorPrivateDecryptionKey: CryptoEncoderFactory.defaultStringPublicKeyEncryptionEncoder().encodePrivateDecryptionKey(actorPrivateDecryptionKey)
            }
        }))
        if (creatorId === actorId) {
            const channelKey = await this.deriveChannelKey(channelId);
            logger.debug(`Channel key derived from private signature key for channel ${channelId}: ${channelKey}`)
            return channelKey;
        }

        // ... otherwise we have to obtain the (encryption of the) channel key from an invitation section.
        const channelKey = await this.getChannelKeyFromInvitation(actorId, channelId, actorPrivateDecryptionKey);
        logger.debug(`Channel key decrypted from invitation for channel ${channelId}: ${channelKey}`)
        return channelKey;
    }


    /**
     * Returns a channel key derived directly from the private key of the current actor.
     * @param channelId
     */
    async deriveChannelKey(channelId: number) {

        // TODO: change the way we derive the channel key!!!!!!
        const myPrivateSignatureKey = this.provider.getPrivateSignatureKey();
        const myPrivateSignatureKeyBytes = myPrivateSignatureKey.getPrivateKeyAsBytes();
        const genesisSeed = await this.getGenesisSeed();
        const salt = new Uint8Array();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("CHANNEL_KEY"), genesisSeed.toBytes(), channelId);

        const hkdf = new HKDF();

        // TODO(crypto): replace the HKDF call taken as inputs the private key with a call to a seed
        return hkdf.deriveKey(myPrivateSignatureKeyBytes, salt, info, 32);
    }


    /**
     * Returns a channel key from an invitation obtained directly from a microblock.
     *
     * An invitation contains, in particular, contains the encryption of a channel key that should be decrypted
     * by a shared key, encrypted using the public key of the actor id.
     *
     * @param actorId
     * @param channelId
     * @param actorPrivateDecryptionKey The (asymmetric) decryption key used to decrypt the shared key, later used to decrypt the channel key.
     * @private
     *
     * @throws ActorNotInvitedError Occurs when no invitation of the actor has been found.
     * @throws NoSharedSecretError Occurs when no shared secret key has been found.
     * @throws DecryptionError Occurs when one of the encrypted channel key or encrypted shared key cannot be decrypted.
     */
    private async getChannelKeyFromInvitation(
        actorId: number,
        channelId: number,
        actorPrivateDecryptionKey: AbstractPrivateDecryptionKey
    ) {
        Assertion.assert(typeof actorId === 'number', `actorId should be a number, got ${typeof actorId}`)
        Assertion.assert(typeof channelId === 'number', `channelId should be a number, got ${typeof actorId}`)


        // look for an invitation of actorId to channelId and extract the encrypted channel key
        const actor = this.state.getActorById(actorId);
        const actorOnChannelInvitation = actor.invitations.find(
            (invitation) => invitation.channelId == channelId
        );

        // if there is no invitation, then the actor is not allowed, easy
        if (!actorOnChannelInvitation) {
            const actor = this.state.getActorById(actorId);
            const actorName = actor.name;
            const channel = this.state.getChannelFromChannelId(channelId);
            const channelName = channel.name;
            throw new ActorNotInvitedError(actorName, channelName);
        }

        // we search for the channel invitation
        const invitationMicroblock = await this.getMicroblock(actorOnChannelInvitation.height);
        const invitationSection = invitationMicroblock.getSection<ApplicationLedgerChannelInvitationSection>((section: Section<ApplicationLedgerChannelInvitationSection>) =>
            section.type == SECTIONS.APP_LEDGER_CHANNEL_INVITATION &&
            section.object.channelId == channelId &&
            section.object.guestId == actorId
        );

        const hostId = invitationSection.object.hostId;
        const encryptedChannelKey = invitationSection.object.encryptedChannelKey;

        // look for the shared secret between actorId and hostId
        const sharedSecret = actor.sharedSecrets.find(
            (sharedSecret) => sharedSecret.peerActorId == hostId
        );
        if (!sharedSecret) {
            throw new NoSharedSecretError(actorId, hostId);
        }

        const sharedSecretMicroblock = await this.getMicroblock(sharedSecret.height);
        const sharedSecretSection = sharedSecretMicroblock.getSection<ApplicationLedgerSharedKeySection>((section: any) =>
            section.type == SECTIONS.APP_LEDGER_SHARED_SECRET &&
            section.object.hostId == hostId &&
            section.object.guestId == actorId
        );
        const encryptedSharedKey = sharedSecretSection.object.encryptedSharedKey;
        const hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(
            actorPrivateDecryptionKey.decrypt(encryptedSharedKey)
        );
        const channelKey = hostGuestSharedKey.decrypt(encryptedChannelKey);
        return channelKey;
    }

    /**
     * Returns an instance of an intermediate representation defining only the channels.
     */
    getChannelSpecializedIntermediateRepresentationInstance() {
        const ir = new IntermediateRepresentation;

        const numberOfChannels = this.state.getNumberOfChannels();

        for (let channelId = 0; channelId < numberOfChannels; channelId++) {
            const channel = this.state.getChannelFromChannelId(channelId);

            if (channel.isPrivate) {
                ir.addPrivateChannel(channelId);
            } else {
                ir.addPublicChannel(channelId);
            }
        }
        return ir;
    }


    /**
     * Identifies and retrieves the actor ID associated with the current public signature key in the provider.
     * It validates the keyed provider, retrieves the public signature key, and checks against actor subscription data
     */
    async getActorIdAssociatedWithKeyInProvider() {
        const myPublicSignatureKey = this.provider.getPublicSignatureKey();
        return this.getActorIdByPublicSignatureKey(myPublicSignatureKey)
    }



    /**
     * Exports a proof containing intermediate representations for all microblocks up to the current height of the virtual blockchain.
     *
     * @param {Object} customInfo - Custom information to include in the proof.
     * @param hostPrivateDecryptionKey
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

        for (let height = 1; height <= this.getHeight(); height++) {
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
            virtualBlockchainIdentifier: Utils.binaryToHexa(this.getIdentifier().toBytes())
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

        for (let height = 1; height <= this.getHeight(); height++) {
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
                // TODO(fix): need attention
                // @ts-ignore
                data: ir.exportToJson()
            });
        }

        return data;
    }




    /**
     * Creates a shared key between two peers.
     */




    /**
     * Retrieves a record by fetching the microblock intermediate representation
     * and exporting it to JSON.
     *
     * @param {Height} height - The height at which the record is to be fetched.
     * @param {AbstractPrivateDecryptionKey} [hostPrivateDecryptionKey] - Optional private decryption key for the host.
     * @return {Promise<T>} A promise that resolves with the exported record in JSON format.
     */
    async getRecord<T = any>(height: Height, hostPrivateDecryptionKey?: AbstractPrivateDecryptionKey) {
        const ir = await this.getMicroblockIntermediateRepresentation(height, hostPrivateDecryptionKey);
        return ir.exportToJson() as T;
    }




    /**
     Section callbacks
     */

    /*
    async allowedSignatureSchemesCallback(microblock: any, section: any) {
        this.getState().allowedSignatureSchemeIds = section.object.schemeIds;
    }

    async allowedPkeSchemesCallback(microblock: any, section: any) {
        this.getState().allowedPkeSchemeIds = section.object.schemeIds;
    }

    async declarationCallback(microblock: Microblock, section: Section<ApplicationLedgerDeclarationSection>) {
        this.getState().applicationId = section.object.applicationId;
    }

    async actorCreationCallback(microblock: Microblock, section: Section<ApplicationLedgerActorCreationSection>) {
        const state = this.getState();

        if (section.object.id != state.actors.length) {
            throw new InvalidActorError(section.object.id, state.actors.length);
        }
        if (state.actors.some((obj: any) => obj.name == section.object.name)) {
            throw new ActorAlreadyDefinedError(section.object.name);
        }
        state.actors.push({
            name: section.object.name,
            subscribed: false,
            signatureKeyHeight: 0,
            pkeKeyHeight: 0,
            sharedSecrets: [],
            invitations: []
        });
    }

    async actorSubscriptionCallback(microblock: any, section: any) {
        const state = this.getState();
        const actor = state.actors[section.object.actorId]; // I have remove - 1 because it causes invalid actorId

        if (actor === undefined) {
            throw new CannotSubscribeError(section.object.actorId);
        }
        if (actor.subscribed) {
            throw new AlreadySubscribedError(section.object.actorId);
        }

        // we check that the provided public signature scheme is allowed
        const checkedSignatureSchemeId = section.object.signatureSchemeId;
        const allowedSignatureSchemeIds = state.allowedSignatureSchemeIds;
        const isAllowingAllSignatureSchemes = allowedSignatureSchemeIds.length == 0;
        const isExplicitlyAllowedSignatureScheme = allowedSignatureSchemeIds.includes(checkedSignatureSchemeId);
        const isNotAllowedSignatureScheme = !isAllowingAllSignatureSchemes && !isExplicitlyAllowedSignatureScheme;
        if (isNotAllowedSignatureScheme) {
            throw new NotAllowedSignatureSchemeError(section.object.signatureSchemeId);
        }

        // we check that the provided public key encryption scheme is allowed
        const checkedPkeSchemeId = section.object.pkeSchemeId;
        const allowedPkeSchemeIds = state.allowedPkeSchemeIds;
        const isAllowingAllPkeSchemes = allowedPkeSchemeIds.length == 0;
        const isExplicitlyAllowedPkeScheme = allowedPkeSchemeIds.includes(checkedPkeSchemeId);
        const isNotAllowedPkeScheme = !isAllowingAllPkeSchemes && !isExplicitlyAllowedPkeScheme;
        if (isNotAllowedPkeScheme) {
            throw new NotAllowedPkeSchemeError(section.object.pkeSchemeId);
        }

        actor.subscribed = true;
        actor.signatureKeyHeight = microblock.header.height;
        actor.pkeKeyHeight = microblock.header.height;
    }

    async channelCreationCallback(microblock: any, section: any) {
        const state = this.getState();
        if (section.object.id != state.channels.length) {
            throw new InvalidChannelError(section.object.id);
        }
        if (state.channels.some((obj: any) => obj.name == section.object.name)) {
            throw new ChannelAlreadyDefinedError(section.object.name);
        }
        state.channels.push({
            name: section.object.name,
            isPrivate: section.object.isPrivate,
            creatorId: section.object.creatorId
        });
    }

    async sharedSecretCallback(microblock: Microblock, section: Section<ApplicationLedgerSharedKeySection>) {
        // TODO: check that there is no shared secret yet
        // TODO: check that there host and guest already exists
        // Here

        // we update the local state with the shared secret section
        const { hostId, guestId } = section.object;
        const state = this.getState();

        // update first the actor
        const hostActor = state.actors[hostId];
        hostActor.sharedSecrets.push({
            height: microblock.getHeight(), peerActorId: guestId
        });

        // then update the guest
        const guestActor = state.actors[guestId];
        guestActor.sharedSecrets.push({
            height: microblock.getHeight(), peerActorId: hostId
        })
    }

    async invitationCallback(microblock: Microblock, section: Section<ApplicationLedgerChannelInvitationSection>) {
        // TODO: check that the actor is not already in the channel
        // Here

        // we update the local state with the invitation section
        const {guestId, channelId} = section.object;
        const state = this.getState();
        const guestActor = state.actors[guestId];
        guestActor.invitations.push({
            channelId,
            height: microblock.getHeight()
        })
        const logger = Logger.getLogger();
        logger.debug("Updated state after channel invitation callback: {state}", {state: this.state})
    }

    async publicChannelDataCallback(microblock: Microblock, section: any) {
        if (!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async privateChannelDataCallback(microblock: Microblock, section: any) {
        if (!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async endorserSignatureCallback(microblock: Microblock, section: any) {
    }

    async authorSignatureCallback(microblock: Microblock, section: any) {
        const application = new Application({provider: this.provider});
        await application._load(this.getState().applicationId);
        const publicKey = await application.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

     */

    getLocalState() {
        return this.state;
    }
}
