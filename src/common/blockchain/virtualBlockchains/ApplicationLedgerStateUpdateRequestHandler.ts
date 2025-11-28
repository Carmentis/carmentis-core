import {ApplicationLedgerMicroblockBuilder} from "./ApplicationLedgerMicroblockBuilder";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {AppLedgerStateUpdateRequest} from "../../type/AppLedgerStateUpdateRequest";
import {
    AbstractPrivateDecryptionKey,
    AbstractPublicEncryptionKey
} from "../../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {Microblock} from "../microblock/Microblock";
import {SchemaValidator} from "../../data/schemaValidator";
import {Utils} from "../../utils/utils";
import {ActorType} from "../../constants/ActorType";
import {Crypto} from "../../crypto/crypto";
import {DecryptionError, IllegalParameterError, SharedKeyDecryptionError} from "../../errors/carmentis-error";
import {SCHEMAS} from "../../constants/constants";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {Assertion} from "../../utils/Assertion";
import {Logger} from "../../utils/Logger";
import {HKDF} from "../../crypto/kdf/HKDF";
import {AES256GCMSymmetricEncryptionKey} from "../../crypto/encryption/symmetric-encryption/encryption-interface";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";

export class ApplicationLedgerStateUpdateRequestHandler extends ApplicationLedgerMicroblockBuilder {

    static async createFromVirtualBlockchain(vb: ApplicationLedgerVb, authorPrivateSignatureKey: PrivateSignatureKey) {
        const copyVb = structuredClone(vb);
        const mb = await copyVb.createMicroblock();
        return new ApplicationLedgerStateUpdateRequestHandler(mb, copyVb, authorPrivateSignatureKey)
    }



    constructor(
        mbUnderConstruction: Microblock,
        vb: ApplicationLedgerVb,
        private readonly authorPrivateSignatureKey: PrivateSignatureKey
    ) {
        super(mbUnderConstruction, vb);
    }

    private get state() {
        return this.getLocalState()
    }


    async createMicroblockFromStateUpdateRequest(
        hostPrivateDecryptionKey: AbstractPrivateDecryptionKey,
        object: AppLedgerStateUpdateRequest
    ) {
        const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
        validator.validate(object);

        // if there's a reference to an existing VB, load it
        /* THIS SHOULD BE DONE OUTSIDE OF THE APPLICATIONLEDGERVB!!!
        if (object.virtualBlockchainId) {
            await this.vb.load(Utils.binaryFromHexa(object.virtualBlockchainId));
        }
         */


        const isBuildingGenesisMicroBlock = this.vb.isEmpty();
        if (isBuildingGenesisMicroBlock) {
            // genesis -> link the application ledger with the application id
            const section = this.mbUnderConstruction.addApplicationLedgerDeclarationSection({
                applicationId: Utils.binaryFromHexa(object.applicationId)
            });
            await this.updateStateWithSection(section);
        }

        // add the new actors
        let freeActorId = this.state.getNumberOfActors();
        for (const def of object.actors || []) {
            const createdSection = this.mbUnderConstruction.addApplicationLedgerActorCreationSection({
                id: freeActorId,
                type: ActorType.UNKNOWN,
                name: def.name
            })
            await this.updateStateWithSection(createdSection);
            freeActorId = freeActorId + 1;
        }


        // when creating the virtual blockchain application ledger, the author is automatically
        // subscribed (it should also be created above so it must be specified in the actors section).
        const authorName = object.author;
        const authorId = this.getActorIdFromActorName(authorName);
        if (isBuildingGenesisMicroBlock) {
            const authorPublicEncryptionKey = await hostPrivateDecryptionKey.getPublicKey();
            await this.subscribeActor(
                authorName,
                await this.authorPrivateSignatureKey.getPublicKey(),
                authorPublicEncryptionKey
            );
        }



        // add the new channels
        let freeChannelId = this.state.getNumberOfChannels();
        for (const def of object.channels || []) {
            const createdSection = this.mbUnderConstruction.addApplicationLedgerChannelCreationSection({
                id: freeChannelId,
                isPrivate: !def.public,
                creatorId: authorId,
                name: def.name
            });
            await this.updateStateWithSection(createdSection);
            freeChannelId += 1;
        }



        // initialize an IR object, set the channels and load the data
        const ir = this.vb.getChannelSpecializedIntermediateRepresentationInstance();
        ir.buildFromJson(object.data);

        // process field assignations
        for (const def of object.channelAssignations || []) {
            const channelId = this.state.getChannelIdFromChannelName(def.channelName);
            ir.setChannel(def.fieldPath, channelId);
        }

        // process actor assignations
        // Note: we do not verify that the guest is already in the channel, this is verified in the callback during
        // section verifications.
        for (const def of object.actorAssignations || []) {
            const channelName = def.channelName;
            const actorName = def.actorName;
            await this.inviteActorOnChannel(
                actorName,
                channelName,
                hostPrivateDecryptionKey
            )
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
        ir.finalizeChannelData();

        const channelDataList = ir.exportToSectionFormat();
        for (const channelData of channelDataList) {
            const {isPrivate: isPrivateChannel, channelId} = channelData;
            if (isPrivateChannel) {
                const channelKey = await this.vb.getChannelKey(authorId, channelId, this.authorPrivateSignatureKey, hostPrivateDecryptionKey);
                const channelSectionKey = this.vb.deriveChannelSectionKey(channelKey, this.vb.getHeight(), channelId);
                const channelSectionIv = this.vb.deriveChannelSectionIv(channelKey, this.vb.getHeight(), channelId);
                const encryptedData = Crypto.Aes.encryptGcm(channelSectionKey, channelData.data, channelSectionIv);
                const createdSection = this.mbUnderConstruction.addApplicationLedgerPrivateChannelSection({
                    channelId: channelId,
                    merkleRootHash: Utils.binaryFromHexa(channelData.merkleRootHash),
                    encryptedData: encryptedData
                });
                await this.updateStateWithSection(createdSection)
            } else {
                const createdSection = this.mbUnderConstruction.addApplicationLedgerPublicChannelSection({
                    channelId,
                    data: channelData.data
                });
                await this.updateStateWithSection(createdSection)
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
            const endorserId = this.getActorIdFromActorName(object.endorser);
            const messageToShow = object.approvalMessage ?? "";
            const createdSection = this.mbUnderConstruction.addApplicationLedgerEndorsementRequestSection({
                message: messageToShow,
                endorserId
            });
            await this.updateStateWithSection(createdSection)
        }

        return this.mbUnderConstruction
    }

    async inviteActorOnChannel(actorName: string, channelName: string, hostPrivateDecryptionKey: AbstractPrivateDecryptionKey) {
        const channelId = this.state.getChannelIdFromChannelName(channelName);
        const actorId = this.getActorIdFromActorName(actorName);
        Assertion.assert(typeof channelId === 'number', `Expected channel id of type number: got ${typeof channelId} for channel ${channelName}`)

        const authorId = await this.vb.getActorIdByPublicSignatureKey(await this.authorPrivateSignatureKey.getPublicKey());
        const hostId = authorId; // the host is the author (and in the current version of the protocol, this is the operator)
        const guestId = actorId; // the guest is the actor assigned to the channel

        // if the guestId equals the hostId, it is likely a misuse of the record. In this case, we do not do anything
        // because the author is already in the channel by definition (no need to create a shared key, ...).
        if (hostId === guestId) return;

        // To invite the actor in the channel, we first retrieve or generate a symmetric encryption key used to establish
        // secure communication between both peers. The key is then used to encrypt the channel key and put in a dedicated
        // section of the microblock.
        const hostGuestEncryptedSharedKey =
            await this.vb.getExistingSharedKey(hostId, guestId) ||
            await this.vb.getExistingSharedKey(guestId, hostId);

        // if we have found the (encrypted) shared secret key, then we *attempt* to decrypt it, otherwise
        // there is no shared secret key and then we create a new one
        let hostGuestSharedKey: AES256GCMSymmetricEncryptionKey;
        if (hostGuestEncryptedSharedKey !== undefined) {
            try {
                hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(
                    await hostPrivateDecryptionKey.decrypt(hostGuestEncryptedSharedKey)
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
        const channelKey = await this.vb.getChannelKey(hostId, channelId, this.authorPrivateSignatureKey, hostPrivateDecryptionKey);
        const encryptedChannelKey = await hostGuestSharedKey.encrypt(channelKey);

        // we log the result
        const logger = Logger.getLogger([ApplicationLedgerVb.name]);
        logger.info(`Actor {guestName} invited to channel ${channelName}`, () => ({
            guestName: actorName,
        }))
        logger.debug(`Channel key for channel ${channelName}: ${channelKey}`)

        // we create the section containing the encrypted channel key (that can only be decrypted by the host and the guest)
        const createdSection = this.mbUnderConstruction.addApplicationLedgerChannelInvitationSection({
            channelId,
            hostId,
            guestId,
            encryptedChannelKey,
        })
        await this.updateStateWithSection(createdSection);
    }


    private async createSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, hostId: number, guestId: number) {
        const {
            encryptedSharedKey,
            hostGuestSharedKey
        } = await this.generateSharedKeyAndEncryptedSharedKey(hostPrivateDecryptionKey, guestId);

        // we create the section containing the shared secret key
        const addedSection = this.mbUnderConstruction.addApplicationLedgerSharedKeySection({
            hostId,
            guestId,
            encryptedSharedKey,
        });
        await this.updateStateWithSection(addedSection);

        return hostGuestSharedKey;
    }






    /**
     * TODO: SHOULD NOT DERIVE FROM THE PRIVATE DECRYPTION KEY BUT FROM A DEDICATED SEED
     * @param hostPrivateDecryptionKey
     * @param vbGenesisSeed
     * @param guestId
     * @private
     */
    private static deriveHostGuestSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, vbGenesisSeed: Uint8Array, guestId: number) {
        const hostPrivateDecryptionKeyBytes = hostPrivateDecryptionKey.getRawPrivateKey();
        const encoder = new TextEncoder;
        const info = Utils.binaryFrom(encoder.encode("SHARED_SECRET"), guestId);
        const hkdf = new HKDF();
        const keyMaterial = Utils.binaryFrom(hostPrivateDecryptionKeyBytes, vbGenesisSeed)
        const hostGuestSharedKeyBytes = hkdf.deriveKeyNoSalt(keyMaterial, info, 32);
        const hostGuestSharedKey = AES256GCMSymmetricEncryptionKey.createFromBytes(hostGuestSharedKeyBytes);
        return hostGuestSharedKey;
    }


    private async generateSharedKeyAndEncryptedSharedKey(hostPrivateDecryptionKey: AbstractPrivateDecryptionKey, guestId: number) {
        const vbGenesisSeed = await this.getGenesisSeed();
        const hostGuestSharedKey = ApplicationLedgerStateUpdateRequestHandler.deriveHostGuestSharedKey(hostPrivateDecryptionKey, vbGenesisSeed.toBytes(), guestId);

        // we encrypt the shared key with the guest's public key
        const guestPublicEncryptionKey = await this.vb.getPublicEncryptionKeyByActorId(guestId);
        const encryptedSharedKey = await guestPublicEncryptionKey.encrypt(hostGuestSharedKey.getRawSecretKey());
        return {encryptedSharedKey, hostGuestSharedKey}
    }

    private async getGenesisSeed() {
        if (this.vb.isEmpty()) {
            return this.mbUnderConstruction.getPreviousHash();
        } else {
            return await this.vb.getGenesisSeed();
        }
    }

    /**
     * Subscribes an actor in the application ledger.
     *
     * A subscription is used to associate public keys to an actor name (or identifier).
     *
     * In contrast with the actor creation declaring a new actor without associating a signature and encryption public
     * key, the actor subscription associates the signature and the encryption public keys an actor.
     * Be aware that the subscribed actor should be already defined!
     *
     *
     * @param actorName The name of the actor subscribed on the application ledger.
     * @param actorPublicSignatureKey  The public signature key of the actor.
     * @param actorPublicEncryptionKey The public encryption key of the actor.
     *
     * @returns
     */
    private async subscribeActor(
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
        const addedSection =  this.mbUnderConstruction.addApplicationLedgerActorSubscriptionSection({
            actorId,
            actorType: unknownActorType,
            organizationId: nullOrganizationId,
            signatureSchemeId: actorPublicSignatureKey.getSignatureSchemeId(),
            signaturePublicKey: await actorPublicSignatureKey.getPublicKeyAsBytes(),
            pkeSchemeId: actorPublicEncryptionKey.getSchemeId(),
            pkePublicKey: await actorPublicEncryptionKey.getRawPublicKey(),
        });
        await this.updateStateWithSection(addedSection);
    }



    private getActorIdFromActorName(actorName: string) {
        return this.state.getActorIdByName(actorName);
    }
}