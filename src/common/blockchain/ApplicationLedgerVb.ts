import {CHAIN, SECTIONS} from "../constants/constants";
import {VirtualBlockchain} from "./VirtualBlockchain";
import {Application} from "./Application";
import {StructureChecker} from "./StructureChecker";
import {PrivateSignatureKey} from "../crypto/signature/signature-interface";
import {HKDF} from "../crypto/kdf/HKDF";
import {ApplicationLedgerVBState} from "./types";
import {IntermediateRepresentation} from "../records/intermediateRepresentation";
import {Provider} from "../providers/Provider";
import {BlockchainReader} from "../providers/BlockchainReader";
import {Utils} from "../utils/utils";

const KDF_CHANNEL_KEY_PREFIX = 0x00;
const KDF_CHANNEL_SECTION_KEY_PREFIX = 0x01;
const KDF_CHANNEL_SECTION_IV_PREFIX = 0x02;

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
    CurrentActorNotFoundError,
} from "../errors/carmentis-error";

export class ApplicationLedgerVb extends VirtualBlockchain<ApplicationLedgerVBState> {
    constructor({provider}: { provider: Provider }) {
        super({ provider, type: CHAIN.VB_APP_LEDGER });

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

    async addDeclaration(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
    }

    async createActor(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, object);
    }

    async subscribe(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION, object);
    }

    async createChannel(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, object);
    }

    async createSharedSecret(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_SHARED_SECRET, object);
    }

    async inviteToChannel(object: any) {
        await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_INVITATION, object);
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
     Helper methods
     */
    getIntermediateRepresentationInstance() {
        const ir = new IntermediateRepresentation;

        const numberOfChannels = this.getNumberOfChannels();

        for(let channelId = 0; channelId < numberOfChannels; channelId++) {
            const channel = this.getChannelById(channelId);

            if(channel.isPrivate) {
                ir.addPrivateChannel(channelId);
            }
            else {
                ir.addPublicChannel(channelId);
            }
        }
        return ir;
    }

    getChannelId(name: string) {
        const id = this.getState().channels.findIndex((obj: any) => obj.name == name);
        if(id == -1) {
            throw new ChannelNotDefinedError(name)
        }
        return id;
    }

    getChannel(name: string) {
        const channel = this.getState().channels.find((obj: any) => obj.name == name);
        if(channel === undefined) {
            throw new ChannelNotDefinedError(name)
        }
        return channel;
    }

    async getChannelKey(actorId: number, channelId: number) {
        const state = this.getState();
        const creatorId = state.channels[channelId].creatorId;

        if(creatorId == actorId) {
            return await this.deriveChannelKey(channelId);
        }

        return await this.getChannelKeyFromInvitation(actorId, channelId);
    }

    async getChannelKeyFromInvitation(actorId: number, channelId: number) {
        const state = this.getState();

        // look for an invitation of actorId to channelId and extract the encrypted channel key
        const invitation = state.actors[actorId].invitations.find((invitation) => invitation.channelId == channelId);

        if(!invitation) {
            throw new ActorNotInvitedError(actorId, channelId);
        }

        const invitationMicroblock = await this.getMicroblock(invitation.height);

        const invitationSection: any = invitationMicroblock.getSection((section: any) =>
            section.type == SECTIONS.APP_LEDGER_CHANNEL_INVITATION &&
            section.object.channelId == channelId &&
            section.object.guestId == actorId
        );

        const hostId = invitationSection.hostId;
        const encryptedChannelKey = invitationSection.channelKey;

        // look for the shared secret between actorId and hostId
        const sharedSecret = state.actors[actorId].sharedSecrets.find((sharedSecret) => sharedSecret.peerActorId == hostId);

        if(!sharedSecret) {
            throw new NoSharedSecretError(actorId, hostId);
        }

        const sharedSecretMicroblock = await this.getMicroblock(sharedSecret.height);

        const sharedSecretSection: any = invitationMicroblock.getSection((section: any) =>
            section.type == SECTIONS.APP_LEDGER_SHARED_SECRET &&
            section.object.hostId == hostId &&
            section.object.guestId == actorId
        );

        const encapsulation = sharedSecretSection.encapsulation;

        // TODO: decrypt the channel key

        return new Uint8Array(32);
    }

    async deriveChannelKey(channelId: number) {
        if (!this.provider.isKeyed()) {
            throw new Error(`a keyed provider is required`);
        }

        const myPrivateSignatureKey = this.provider.getPrivateSignatureKey();
        const myPrivateSignatureKeyBytes = myPrivateSignatureKey.getPrivateKeyAsBytes();

        const salt = new Uint8Array();

        const info = Utils.binaryFrom(
            KDF_CHANNEL_KEY_PREFIX,
            channelId,
            await this.getGenesisSeed()
        );

        const hkdf = new HKDF();

        return hkdf.deriveKey(myPrivateSignatureKeyBytes, salt, info, 32);
    }

    deriveChannelSectionKey(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, KDF_CHANNEL_SECTION_KEY_PREFIX, height, channelId, 32);
    }

    deriveChannelSectionIv(channelKey: Uint8Array, height: number, channelId: number) {
        return this.deriveChannelSectionMaterial(channelKey, KDF_CHANNEL_SECTION_IV_PREFIX, height, channelId, 12);
    }

    deriveChannelSectionMaterial(channelKey: Uint8Array, prefix: number, height: number, channelId: number, keyLength: number) {
        const salt = new Uint8Array();

        const info = Utils.binaryFrom(
            prefix,
            channelId,
            Utils.intToByteArray(height, 6)
        );

        const hkdf = new HKDF();

        return hkdf.deriveKey(channelKey, salt, info, keyLength);
    }

    getActorId(name: string) {
        const id = this.getState().actors.findIndex((obj: any) => obj.name == name);
        if(id == -1) {
            throw new ActorNotDefinedError(name);
        }
        return id;
    }

    getActor(name: string) {
        const actor = this.getState().actors.find((obj: any) => obj.name == name);
        if(actor === undefined) {
            throw new ActorNotDefinedError(name);
        }
        return actor;
    }

    async getCurrentActorId() {
        if (!this.provider.isKeyed()) {
            throw new Error(`a keyed provider is required`);
        }

        const myPublicSignatureKey = this.provider.getPublicSignatureKey();
        const myPublicSignatureKeyBytes = myPublicSignatureKey.getPublicKeyAsBytes();

        const state = this.getState();

        for(const id in state.actors) {
            const actorId = Number(id);
            const actor = state.actors[actorId];
            const keyMicroblock = await this.getMicroblock(actor.signatureKeyHeight);
            const keySection = keyMicroblock.getSection((section: any) =>
                section.type == SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION &&
                Utils.binaryIsEqual(section.object.signaturePublicKey, myPublicSignatureKeyBytes)
            );
            if(keySection) {
                return actorId;
            }
        }

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

    async declarationCallback(microblock: any, section: any) {
        this.getState().applicationId = section.object.applicationId;
    }

    async actorCreationCallback(microblock: any, section: any) {
        const state = this.getState();

        if(section.object.id != state.actors.length) {
            throw new InvalidActorError(section.object.id, state.actors.length);
        }
        if(state.actors.some((obj: any) => obj.name == section.object.name)) {
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
        const actor = state.actors[section.object.actorId - 1];

        if(actor === undefined) {
            throw new CannotSubscribeError(section.object.actorId);
        }
        if(actor.subscribed) {
            throw new AlreadySubscribedError(section.object.actorId);
        }
        if(!state.allowedSignatureSchemeIds.includes(section.object.signatureSchemeId)) {
            throw new NotAllowedSignatureSchemeError(section.object.signatureSchemeId);
        }
        if(!state.allowedPkeSchemeIds.includes(section.object.pkeSchemeId)) {
            throw new NotAllowedPkeSchemeError(section.object.pkeSchemeId);
        }

        actor.subscribed = true;
        actor.signatureKeyHeight = microblock.header.height;
        actor.pkeKeyHeight = microblock.header.height;
    }

    async channelCreationCallback(microblock: any, section: any) {
        const state = this.getState();
        if(section.object.id != state.channels.length) {
            throw new InvalidChannelError(section.object.id);
        }
        if(state.channels.some((obj: any) => obj.name == section.object.name)) {
            throw new ChannelAlreadyDefinedError(section.object.name);
        }
        state.channels.push({
            name: section.object.name,
            isPrivate: section.object.isPrivate,
            creatorId: section.object.creatorId
        });
    }

    async sharedSecretCallback(microblock: any, section: any) {
    }

    async invitationCallback(microblock: any, section: any) {
    }

    async publicChannelDataCallback(microblock: any, section: any) {
        if(!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async privateChannelDataCallback(microblock: any, section: any) {
        if(!this.getState().channels[section.object.channelId]) {
            throw `invalid channel ID ${section.object.channelId}`;
        }
    }

    async endorserSignatureCallback(microblock: any, section: any) {
    }

    async authorSignatureCallback(microblock: any, section: any) {
        const application = new Application({ provider: this.provider });
        await application._load(this.getState().applicationId);
        const publicKey = await application.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }

    /**
     Structure check
     */
    checkStructure(microblock: any) {
        const checker = new StructureChecker(microblock);
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
    getNumberOfChannels() : number {
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

    protected getInitialState(): ApplicationLedgerVBState {
        return {
            allowedSignatureSchemeIds: [],
            allowedPkeSchemeIds: [],
            applicationId: ApplicationLedgerVb.UNDEFINED_APPLICATION_ID,
            actors: [],
            channels: []
        }
    }
}
