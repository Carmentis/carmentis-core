import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Application} from "./Application";
import {StructureChecker} from "./StructureChecker";
import {HKDF} from "../crypto/kdf/HKDF";
import {
    ApplicationLedgerActorCreationSection, ApplicationLedgerSharedSecretState,
    ApplicationLedgerActorSubscriptionSection,
    ApplicationLedgerChannelInvitationSection, ApplicationLedgerDeclarationSection,
    ApplicationLedgerEndorsementRequestSection, ApplicationLedgerSharedKeySection,
    ApplicationLedgerLocalStateObject
} from "./types";
import {IntermediateRepresentation} from "../records/intermediateRepresentation";
import {Provider} from "../providers/Provider";
import {Utils} from "../utils/utils";

import {
    ActorAlreadyDefinedError,
    ChannelAlreadyDefinedError,
    ActorNotDefinedError,
    InvalidActorError,
    ChannelNotDefinedError,
    CannotSubscribeError,
    AlreadySubscribedError,
    NotAllowedSignatureSchemeError,
    NotAllowedPkeSchemeError,
    InvalidChannelError,
    ActorNotInvitedError,
    NoSharedSecretError,
    CurrentActorNotFoundError, MicroBlockNotFoundInVirtualBlockchainAtHeightError, CarmentisError, SectionNotFoundError,
} from "../errors/carmentis-error";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {Microblock, Section} from "./Microblock";
import {
    AbstractPrivateDecryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {AES256GCMSymmetricEncryptionKey} from "../crypto/encryption/symmetric-encryption/encryption-interface";
import {Logger} from "../utils/Logger";
import {Crypto} from "../crypto/crypto";
import {Assertion} from "../utils/Assertion";
import {CryptoEncoderFactory} from "../crypto/CryptoEncoderFactory";

export class ApplicationLedgerVb extends VirtualBlockchain<ApplicationLedgerLocalStateObject> {
    constructor({provider}: { provider: Provider }) {
        super({provider, type: CHAIN.VB_APP_LEDGER});

        this.state = {
            allowedSignatureSchemeIds: [],
            allowedPkeSchemeIds: [],
            applicationId: new Uint8Array(0),
            actors: [],
            channels: []
        };

        this.registerSectionCallback(SECTIONS.APP_LEDGER_ALLOWED_SIG_SCHEMES, this.allowedSignatureSchemesCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_ALLOWED_PKE_SCHEMES, this.allowedPkeSchemesCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_DECLARATION, this.declarationCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_ACTOR_CREATION, this.actorCreationCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION, this.actorSubscriptionCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_CHANNEL_CREATION, this.channelCreationCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_SHARED_SECRET, this.sharedSecretCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_CHANNEL_INVITATION, this.invitationCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, this.publicChannelDataCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, this.privateChannelDataCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE, this.endorserSignatureCallback);
        this.registerSectionCallback(SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE, this.authorSignatureCallback);
    }

    /**
     Update methods
     */
    async setAllowedSignatureSchemes(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_ALLOWED_SIG_SCHEMES, object);
    }

    async setAllowedPkeSchemes(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_ALLOWED_PKE_SCHEMES, object);
    }

    async addDeclaration(object: ApplicationLedgerDeclarationSection) {
        await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
    }

    async createActor(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, object);
    }

    /**
     * In contrast with the actor creation declaring a new actor without associating a signature and encryption public
     * key, the actor subscription associates the signature and the encryption public keys an actor.
     * Be aware that the subscribed actor should be already defined!
     *
     * @param object
     */
    async subscribeActor(object: ApplicationLedgerActorSubscriptionSection) {
        await this.addSection(SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION, object);
    }

    async createChannel(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, object);
    }

    async createSharedSecret(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_SHARED_SECRET, object);
    }

    async inviteToChannel(section: ApplicationLedgerChannelInvitationSection) {
        await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_INVITATION, section);
    }

    async addPublicChannelData(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA, object);
    }

    async addPrivateChannelData(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA, object);
    }

    /**
     * Signs the current object as the author using the provided private key.
     *
     * @param {PrivateSignatureKey} privateKey - The private key used to generate the author's signature.
     * @return {Promise<void>} A promise that resolves when the author's signature is successfully added to the ledger.
     */
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

    /**
     * This method adds a section containing the endorsement request that containing
     * the identifier of the endorser and the message that should be displayed on the endorse device
     * during approval.
     *
     * @param endorserId Identifier of the endorser.
     * @param messageToDisplay
     */
    async addEndorsementRequest(endorserId: number, messageToDisplay: string) {
        const section: ApplicationLedgerEndorsementRequestSection = {
            endorserId,
            message: messageToDisplay
        };
        return this.addSection(SECTIONS.APP_LEDGER_ENDORSEMENT_REQUEST, section)
    }


    /**
     * Returns an instance of an intermediate representation defining only the channels.
     */
    getChannelSpecializedIntermediateRepresentationInstance() {
        const ir = new IntermediateRepresentation;

        const numberOfChannels = this.getNumberOfChannels();

        for (let channelId = 0; channelId < numberOfChannels; channelId++) {
            const channel = this.getChannelById(channelId);

            if (channel.isPrivate) {
                ir.addPrivateChannel(channelId);
            } else {
                ir.addPublicChannel(channelId);
            }
        }
        return ir;
    }

    getChannelIdByChannelName(channelName: string) {
        const id = this.getState().channels.findIndex((obj: any) => obj.name == channelName);
        if (id == -1) {
            throw new ChannelNotDefinedError(channelName)
        }
        return id;
    }

    getChannelByChannelName(name: string) {
        const channel = this.getState().channels.find((obj: any) => obj.name == name);
        if (channel === undefined) {
            throw new ChannelNotDefinedError(name)
        }
        return channel;
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
        const state = this.getState();
        const creatorId = state.channels[channelId].creatorId;
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

    private getActorNameById(actorId: number) {
        const actor = this.getState().actors[actorId];
        if (actor === undefined) throw new CarmentisError(`Actor not found for id ${actorId}`)
        return actor.name;
    }

    getChannelNameById(channeId: number) {
        const channel = this.getState().channels[channeId];
        if (channel === undefined) throw new CarmentisError(`Channel not found for id ${channeId}`);
        return channel.name;
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
        const state = this.getState();
        const actorOnChannelInvitation = state.actors[actorId].invitations.find(
            (invitation) => invitation.channelId == channelId
        );

        // if there is no invitation, then the actor is not allowed, easy
        if (!actorOnChannelInvitation) {
            const actorName = this.getActorNameById(actorId);
            const channelName = this.getChannelNameById(channelId);
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
        const sharedSecret = state.actors[actorId].sharedSecrets.find(
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
     * Returns a channel key derived directly from the private key of the current actor.
     * @param channelId
     */
    async deriveChannelKey(channelId: number) {
        /* Now, if the provider does not contain a signature key, then it raises an error
        if (!this.provider.isKeyed()) {
            throw new Error(`a keyed provider is required`);
        }

         */

        // TODO: change the way we derive the channel key!!!!!!
        const myPrivateSignatureKey = this.provider.getPrivateSignatureKey();
        const myPrivateSignatureKeyBytes = myPrivateSignatureKey.getPrivateKeyAsBytes();
        const salt = new Uint8Array();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("CHANNEL_KEY"), await this.getGenesisSeed(), channelId);

        const hkdf = new HKDF();

        // TODO(crypto): replace the HKDF call taken as inputs the private key with a call to a seed
        return hkdf.deriveKey(myPrivateSignatureKeyBytes, salt, info, 32);
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

    getActorId(name: string) {
        const id = this.getState().actors.findIndex((obj: any) => obj.name == name);
        if (id == -1) {
            throw new ActorNotDefinedError(name);
        }
        return id;
    }

    getActor(name: string) {
        const actor = this.getState().actors.find((obj: any) => obj.name == name);
        if (actor === undefined) {
            throw new ActorNotDefinedError(name);
        }
        return actor;
    }

    async getCurrentActorId() {
        /* Now, the provider raises an error if it does not contain a signature key
        if (!this.provider.isKeyed()) {
            throw new Error(`a keyed provider is required`);
        }
         */

        const myPublicSignatureKey = this.provider.getPublicSignatureKey();
        const myPublicSignatureKeyBytes = myPublicSignatureKey.getPublicKeyAsBytes();

        const state = this.getState();
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);
        logger.info("Current identity: {data}", () => ({
            data: {
                actors: state.actors,
                currentIdentityPublicKey: CryptoEncoderFactory.defaultStringSignatureEncoder().encodePublicKey(myPublicSignatureKey)
            }
        }))


        for (let actorId = 0; actorId < state.actors.length; actorId++) {
            const actor = state.actors[actorId];
            logger.debug(`Search current actor id: loop index ${actorId}`)
            const isNotSubscribed = !actor.subscribed;
            if (isNotSubscribed) continue;

            try {
                const keyMicroblock = await this.getMicroblock(actor.signatureKeyHeight);
                const keySection = keyMicroblock.getSection((section: Section<ApplicationLedgerActorSubscriptionSection>) => {
                    // we search a section declaring an actor subscription
                    const isActorSubscriptionSection = section.type === SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION;
                    if (!isActorSubscriptionSection) return false;

                    // we search a section focusing the current actor
                    const {actorId: actorFocusedByThisSection} = section.object;
                    const isFocusingActorInTheLoop = actorFocusedByThisSection === actorId;
                    if (!isFocusingActorInTheLoop) return false;

                    // we now ensure that the public signature key declared in the section and used by the current user are matching
                    const {signaturePublicKey} = section.object;
                    const isMatchingPublicKeys = Utils.binaryIsEqual(section.object.signaturePublicKey, myPublicSignatureKeyBytes);
                    logger.debug(`Is public key matching for actor ${actor.name} (id ${actorId})? ${signaturePublicKey} and ${myPublicSignatureKeyBytes}: ${isMatchingPublicKeys}`);
                    return isMatchingPublicKeys
                });
                logger.debug(`Matching public signature key: {actor.name} (id ${actorId})`,{ actor })
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

        logger.debug('Current actor not found: Application ledger state actors: {state.actors}', {state})
        throw new CurrentActorNotFoundError();
    }

    /**
     Section callbacks
     */
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

    /**
     Structure check
     */
    checkStructure(microblock: any) {
        const checker = new StructureChecker(microblock);
        // TODO(mb structure check): check
    }

    /**
     * Retrieves the application ID from the current state.
     *
     * @return {Uint8Array} The application ID as a Uint8Array.
     */
    getApplicationId(): Uint8Array {
        return this.getState().applicationId;
    }

    /**
     * Retrieves the total number of channels currently available.
     *
     * @return {number} The number of channels.
     */
    getNumberOfChannels(): number {
        return this.getState().channels.length;
    }

    /**
     * Retrieves a channel object by its unique identifier.
     *
     * @param {number} channelId - The unique identifier of the channel
     */
    getChannelById(channelId: number) {
        return this.getState().channels[channelId];
    }

    /**
     * Retrieves the total number of actors currently present in the state.
     *
     * @return {number} The number of actors.
     */
    getNumberOfActors(): number {
        return this.getState().actors.length
    }

    private static UNDEFINED_APPLICATION_ID = new Uint8Array(0);

    protected getInitialState(): ApplicationLedgerLocalStateObject {
        return {
            allowedSignatureSchemeIds: [],
            allowedPkeSchemeIds: [],
            applicationId: ApplicationLedgerVb.UNDEFINED_APPLICATION_ID,
            actors: [],
            channels: []
        }
    }
}
