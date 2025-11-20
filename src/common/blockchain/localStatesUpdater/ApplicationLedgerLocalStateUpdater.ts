import {Microblock} from "../microblock/Microblock";
import {IApplicationLedgerLocalStateUpdater, ILocalStateUpdater} from "../localStates/ILocalStateUpdater";
import {ApplicationLedgerLocalState} from "../localStates/ApplicationLedgerLocalState";
import {SectionType} from "../../type/SectionType";
import {
    ActorAlreadyDefinedError,
    AlreadySubscribedError,
    CannotSubscribeError,
    ChannelAlreadyDefinedError,
    ChannelNotDefinedError,
    InvalidActorError,
    InvalidChannelError,
    NotAllowedPkeSchemeError,
    NotAllowedSignatureSchemeError
} from "../../errors/carmentis-error";
import {Logger} from "../../utils/Logger";
import {
    ApplicationLedgerActorCreationSection,
    ApplicationLedgerChannelInvitationSection,
    ApplicationLedgerDeclarationSection,
    ApplicationLedgerSharedKeySection
} from "../../type/sections";
import {Section} from "../../type/Section";

export class AppLedgerLocalStateUpdaterV1 implements ILocalStateUpdater<ApplicationLedgerLocalState>, IApplicationLedgerLocalStateUpdater {
    async updateState(prevState: ApplicationLedgerLocalState, microblock: Microblock): Promise<ApplicationLedgerLocalState> {
        const newState = prevState.clone();
        const mbHeight = microblock.getHeight();
        for (const section of microblock.getAllSections()) {
            await this.updateStateFromSection(prevState, section, mbHeight);
        }
        return newState;
    }

    async updateStateFromSection(prevState: ApplicationLedgerLocalState, section: Section, mbHeight: number): Promise<ApplicationLedgerLocalState> {
        const newState = prevState.clone();
        switch (section.type) {
            case SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES:
                await this.allowedSignatureSchemesCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES:
                await this.allowedPkeSchemesCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_DECLARATION:
                await this.declarationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ACTOR_CREATION:
                await this.actorCreationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION:
                await this.actorSubscriptionCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_CHANNEL_CREATION:
                await this.channelCreationCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_SHARED_SECRET:
                await this.sharedSecretCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_CHANNEL_INVITATION:
                await this.invitationCallback(mbHeight, section, newState);
                break;
            case SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA:
                await this.publicChannelDataCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA:
                await this.privateChannelDataCallback(section, newState);
                break;
            case SectionType.APP_LEDGER_ENDORSER_SIGNATURE:
                await this.endorserSignatureCallback();
                break;
            default:
                const logger = Logger.getLogger();
                logger.warn("Unhandled section type: {type}", {type: section.type});
        }
        return newState;
    }

    /**
     Section callbacks
     */
    async allowedSignatureSchemesCallback(section: Section, localState: ApplicationLedgerLocalState) {
        localState.setAllowedSignatureSchemeIds(section.object.schemeIds)
        //localState.allowedSignatureSchemeIds = section.object.schemeIds;
    }

    async allowedPkeSchemesCallback(section: Section, localState: ApplicationLedgerLocalState) {
        localState.setAllowedSignatureSchemeIds(section.object.schemeIds)
        //localState.allowedPkeSchemeIds = section.object.schemeIds;
    }

    async declarationCallback(section: Section<ApplicationLedgerDeclarationSection>, localState: ApplicationLedgerLocalState) {
        localState.setApplicationId(section.object.applicationId);
    }

    async actorCreationCallback(section: Section<ApplicationLedgerActorCreationSection>, localState: ApplicationLedgerLocalState) {
        const {id: createdActorId, name: createdActorName} = section.object;
        
        // ensure the number of actors is consistent with the actor identifier
        if (section.object.id != localState.getNumberOfActors()) {
            throw new InvalidActorError(section.object.id, localState.getNumberOfActors());
        }
        
        // ensure that no actor has the same name
        if (localState.isActorDefinedByName(createdActorName)) throw new ActorAlreadyDefinedError(section.object.name);
        
        // initially, the actor has no shared invitation, neither shared secrets.
        localState.createActor({
            name: section.object.name,
            subscribed: false,
            signatureKeyHeight: 0,
            pkeKeyHeight: 0,
            sharedSecrets: [],
            invitations: []
        });
    }

    async actorSubscriptionCallback(mbHeight: number, section: Section, localState: ApplicationLedgerLocalState) {
        const actor = localState.getActorById(section.object.actorId); // I have remove - 1 because it causes invalid actorId

        if (actor === undefined) {
            throw new CannotSubscribeError(section.object.actorId);
        }
        if (actor.subscribed) {
            throw new AlreadySubscribedError(section.object.actorId);
        }

        // we check that the provided public signature scheme is allowed
        const checkedSignatureSchemeId = section.object.signatureSchemeId;
        const allowedSignatureSchemeIds = localState.getAllowedSignatureSchemes();
        const isAllowingAllSignatureSchemes = allowedSignatureSchemeIds.length ==0;
        const isExplicitlyAllowedSignatureScheme = allowedSignatureSchemeIds.includes(checkedSignatureSchemeId);
        const isNotAllowedSignatureScheme = !isAllowingAllSignatureSchemes && !isExplicitlyAllowedSignatureScheme;
        if (isNotAllowedSignatureScheme) {
            throw new NotAllowedSignatureSchemeError(section.object.signatureSchemeId);
        }

        // we check that the provided public key encryption scheme is allowed
        const checkedPkeSchemeId = section.object.pkeSchemeId;
        const allowedPkeSchemeIds = localState.getAllowedPkeSchemes();
        const isAllowingAllPkeSchemes = allowedPkeSchemeIds.length === 0;
        const isExplicitlyAllowedPkeScheme = allowedPkeSchemeIds.includes(checkedPkeSchemeId);
        const isNotAllowedPkeScheme = !isAllowingAllPkeSchemes && !isExplicitlyAllowedPkeScheme;
        if (isNotAllowedPkeScheme) {
            throw new NotAllowedPkeSchemeError(section.object.pkeSchemeId);
        }

        actor.subscribed = true;
        actor.signatureKeyHeight = mbHeight;
        actor.pkeKeyHeight = mbHeight;
    }

    async channelCreationCallback(section: Section, localState: ApplicationLedgerLocalState) {
        // ensure provided channel identifier is consistent with the number of channels
        if (section.object.id != localState.getNumberOfChannels()) {
            throw new InvalidChannelError(section.object.id);
        }
        // ensure that there is no channel with the same name
        const createdChannelName = section.object.name;
        if (localState.isChannelDefinedByName(createdChannelName)) {
            throw new ChannelAlreadyDefinedError(createdChannelName);
        }
        
        localState.createChannel({
            name: section.object.name,
            isPrivate: section.object.isPrivate,
            creatorId: section.object.creatorId
        });
    }

    async sharedSecretCallback(mbHeight: number, section: Section<ApplicationLedgerSharedKeySection>, localState: ApplicationLedgerLocalState) {
        // TODO: check that there is no shared secret yet
        // TODO: check that there host and guest already exists
        // Here

        // we update the local state with the shared secret section
        const {hostId, guestId} = section.object;

        // update first the actor
        const hostActor = localState.getActorById(hostId);
        hostActor.sharedSecrets.push({
            height: mbHeight, peerActorId: guestId
        });

        // then update the guest
        const guestActor = localState.getActorById(guestId)
        guestActor.sharedSecrets.push({
            height: mbHeight, peerActorId: hostId
        })
    }

    async invitationCallback(height: number, section: Section<ApplicationLedgerChannelInvitationSection>, localState: ApplicationLedgerLocalState) {
        // TODO: check that the actor is not already in the channel
        // Here

        // we update the local state with the invitation section
        const {guestId, channelId} = section.object;
        const guestActor = localState.getActorById(guestId);
        guestActor.invitations.push({
            channelId,
            height
        })
        const logger = Logger.getLogger();
        logger.debug("Updated state after channel invitation callback: {state}", {state: localState})
    }

    async publicChannelDataCallback(section: Section, localState: ApplicationLedgerLocalState) {
        if (!localState.isChannelDefinedById(section.object.channelId)) {
            throw new ChannelNotDefinedError(`invalid channel ID ${section.object.channelId}`);
        }
    }

    async privateChannelDataCallback(section: Section, localState: ApplicationLedgerLocalState) {
        if (!localState.isChannelDefinedById(section.object.channelId)) {
            throw new ChannelNotDefinedError(`invalid channel ID ${section.object.channelId}`);
        }
    }

    async endorserSignatureCallback() {
    }

    /*
    async authorSignatureCallback(microblock: Microblock, section: Section, localState: ApplicationLedgerLocalState) {
        const application = new Application({provider: this.provider});
        await application._load(localState.applicationId);
        const publicKey = await application.getOrganizationPublicKey();
        const feesPayerAccount = await this.provider.getAccountHashByPublicKey(publicKey);
        microblock.setFeesPayerAccount(feesPayerAccount);
    }
    
     */
}
