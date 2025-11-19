import {
    ApplicationLedgerActor,
    ApplicationLedgerLocalStateObject
} from "../../blockchain/types";
import {Utils} from "../../utils/utils";
import {SignatureSchemeId} from "../../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {ActorNotDefinedError, ChannelAlreadyDefinedError, ChannelNotDefinedError} from "../../errors/carmentis-error";
import {Hash} from "../../entities/Hash";
import {ApplicationLedgerActorCreationSection} from "../../blockchain/sectionSchemas";

export class ApplicationLedgerLocalState {
    private static UNDEFINED_APPLICATION_ID = new Uint8Array(0);

    constructor(private localState: ApplicationLedgerLocalStateObject) {
    }

    static createFromLocalState(localState: ApplicationLedgerLocalStateObject) {
        return new ApplicationLedgerLocalState(localState);
    }


    static createInitialState() {
        return new ApplicationLedgerLocalState({
            actors: [],
            allowedPkeSchemeIds: [],
            allowedSignatureSchemeIds: [],
            applicationId: this.UNDEFINED_APPLICATION_ID,
            channels: []
        })
    }

    clone(): ApplicationLedgerLocalState {
        return new ApplicationLedgerLocalState(structuredClone(this.localState))
    }

    createActor(createdActor: ApplicationLedgerActor) {
        this.localState.actors.push(createdActor);
    }

    createActorWithId(actorId: number, createdActor: ApplicationLedgerActor) {
        if (this.isActorDefinedById(actorId)) throw new ActorNotDefinedError(`Id: ${actorId}`);
        this.localState.actors[actorId] = createdActor;
    }

    setAllowedSignatureSchemeIds(schemeIds: SignatureSchemeId[]) {
        this.localState.allowedSignatureSchemeIds = schemeIds;
    }

    setAllowedPkeSchemeIds(schemeIds: PublicKeyEncryptionSchemeId[]) {
        this.localState.allowedPkeSchemeIds = schemeIds
    }

    setApplicationId(applicationId: Uint8Array) {
        this.localState.applicationId = applicationId;
    }

    isChannelDefinedById(channelId: number) {
        return this.localState.channels[channelId] !== undefined
    }

    isChannelDefinedByName(channelName: string)  {
        return this.localState.channels.some(channel => channel.name === channelName)
    }

    createChannel(createdChannel: {name: string; isPrivate: boolean; creatorId: number}) {
        // ensure that the creator id is defined
        if (this.isActorDefinedById(createdChannel.creatorId)) throw new ActorNotDefinedError(`Id: ${createdChannel.creatorId}`);

        // ensure that there is no channel with the same name
        if (this.isChannelDefinedByName(createdChannel.name)) throw new ChannelAlreadyDefinedError(createdChannel.name);

        // create the channel
        this.localState.channels.push(createdChannel);
    }

    createChannelWithId(channelId: number, createdChannel: { name: string; isPrivate: boolean; creatorId: number }) {
        if (this.isChannelDefinedById(channelId)) throw new ChannelAlreadyDefinedError(`Id: ${channelId}`);
        if (this.isActorDefinedById(createdChannel.creatorId)) throw new ActorNotDefinedError(`Id: ${createdChannel.creatorId}`);
        if (this.isChannelDefinedByName(createdChannel.name)) throw new ChannelAlreadyDefinedError(createdChannel.name);
        this.localState.channels[channelId] = createdChannel;
    }

    isActorDefinedByName(name: string) {
        return this.localState.actors.some(actor => actor.name === name);
    }

    isActorDefinedById(actorId: number) {
        return this.localState.actors[actorId] !== undefined;
    }

    getAllowedSignatureSchemes(): SignatureSchemeId[] {
        return this.localState.allowedSignatureSchemeIds;
    }

    getAllowedPkeSchemes(): PublicKeyEncryptionSchemeId[] {
        return this.localState.allowedPkeSchemeIds;
    }

    getNumberOfActors() {
        return this.localState.actors.length;
    }

    getActorById(actorId: number) {
        const actor = this.localState.actors[actorId];
        if (actor === undefined) throw new ActorNotDefinedError(`ID: ${actorId}`);
        return actor;
    }

    getNumberOfChannels() {
        return this.localState.channels.length;
    }

    getApplicationId(): Hash {
        return Hash.from(this.localState.applicationId);
    }

    getChannelIdFromChannelName(channelName: string): number {
        const id = this.localState.channels.findIndex(c => c.name === channelName);
        if (id === undefined) throw new ChannelNotDefinedError(channelName);
        return id;
    }

    getChannelCreatorIdFromChannelId(channelId: number) {
        const channel = this.getChannelFromChannelId(channelId);
        return channel.creatorId
    }

    getChannelFromChannelId(channelId: number) {
        const channel = this.localState.channels[channelId];
        if (channel === undefined) throw new ChannelNotDefinedError(`ID: ${channelId}`);
        return channel;
    }

    getActorByName(name: string) {
        const actor = this.localState.actors.find(a => a.name === name);
        if (actor === undefined) throw new ActorNotDefinedError(name);
        return actor;
    }

    getActorIdByName(name: string): number {
        const actorIndex = this.localState.actors.findIndex(a => a.name === name);
        if (actorIndex === -1) throw new ActorNotDefinedError(name);
        return actorIndex;
    }
    
    

    updateActor(actorId: number, updatedActor: ApplicationLedgerActor) {
        if (!this.isActorDefinedById(actorId)) throw new ActorNotDefinedError(`Id: ${actorId}`);
        this.localState.actors[actorId] = updatedActor;
    }

    updateChannel(channelId: number, updatedChannel: { name: string; isPrivate: boolean; creatorId: number }) {
        if (!this.isChannelDefinedById(channelId)) throw new ChannelNotDefinedError(`Id: ${channelId}`);
        this.localState.channels[channelId] = updatedChannel;
    }

}