import { ERRORS, DATA, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { organizationVb } from "./vb-organization.js";
import { applicationVb } from "./vb-application.js";
import * as recordManager from "./recordManager.js";
import * as crypto from "../crypto/crypto.js";
import * as util from "../util/util.js";
import * as uint8 from "../util/uint8.js";
import { sectionError, appLedgerError } from "../errors/error.js";

// ============================================================================================================================ //
//  appLedgerVb                                                                                                                 //
// ============================================================================================================================ //
export class appLedgerVb extends virtualBlockchain {
  constructor(id) {
    super(ID.OBJ_APP_LEDGER, id);

    this.channelKeys = new Map();
    this.state.actors = [];
    this.state.channels = [];
  }

  static deriveActorKeyPair(privateKey, genesisSeed) {
    let info = uint8.from(
      crypto.derive.PREFIX_ACTOR_KEY,
      uint8.fromHexa(genesisSeed)
    );

    let actorPrivateKey = uint8.toHexa(crypto.derive.deriveBitsFromKey(privateKey, info, 256)),
        actorPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(actorPrivateKey);

    return {
      privateKey: actorPrivateKey,
      publicKey: actorPublicKey
    };
  }

  isEndorserSubscribed(endorserName) {
    let endorser = this.state.actors.find(actor => actor.name == endorserName);

    return !!(endorser && endorser.subscribed);
  }

  setEndorserActorPublicKey(actorPublicKey) {
    this.endorserActorPublicKey = actorPublicKey;
  }

  async generateDataSections(object) {
    if(this.getHeight() == 1) {
      // genesis -> declare the application with its version
      await this.addDeclaration({
        applicationId: object.applicationId,
        version: object.version
      });
    }
    else if(this.state.version != object.version) {
      // declare application version update
      await this.addVersionUpdate({
        version: object.version
      });
    }

    // add new actors
    for(let actor of object.actors) {
      await this.addActor(actor.name, actor.type);
    }

    // add new channels
    for(let channel of object.channels) {
      await this.addChannel(channel.name, channel.keyOwner);
    }

    // get author and endorser IDs
    let authorId = this.getActorByName(object.author),
        endorserId = this.getActorByName(object.approval.endorser);

    // is the application owner already subscribed?
    if(!this.state.actors[authorId].subscribed) {
      await this.addActorSubscription({
        actorId  : authorId,
        actorType: this.state.actors[authorId].type
      });
    }

    // is the endorser already subscribed?
    if(!this.state.actors[endorserId].subscribed) {
      await this.addActorSubscription({
        actorId  : endorserId,
        actorType: this.state.actors[endorserId].type,
        publicKey: this.endorserActorPublicKey
      });
    }

    // add new invitations
    await this.updateMyIdentity();

    for(let actorName of Object.keys(object.channelInvitations)) {
      let guestId = this.getActorByName(actorName),
          guestPublicKey = await this.getActorPublicKey(this.state.actors[guestId]);

      if(!guestPublicKey) {
        throw new appLedgerError(ERRORS.APP_LEDGER_CANNOT_INVITE, actorName);
      }

      for(let channelName of object.channelInvitations[actorName]) {
        let channelId = this.getChannelByName(channelName);

        await this.addChannelInvitation(channelId, authorId, guestId);
      }
    }

    // load the application definition
    await this.loadApplicationDefinition(this.state.version);

    // turn the permissions into subsections
    let subsections = this.convertPermissionsToSubsections(object.permissions);

    // write channel data
    await this.addChannelData(
      object.fields,
      {
        ...this.appDef.definition,
        subsections: subsections
      }
    );

    // add author
    await this.addAuthor({
      authorId: authorId
    });

    // add endorser
    await this.addEndorser({
      endorserId: endorserId,
      messageId : this.getMessageByName(object.approval.message)
    });

    this.updateGas();
  }

  getRecord(height) {
    return recordManager.getRecord(this, height);
  }

  flattenRecord(record) {
    return recordManager.flattenRecord(this, record);
  }

  getApprovalMessage(height) {
    return recordManager.getApprovalMessage(this, height);
  }

  async loadApplicationDefinition(version) {
    let appVb = new applicationVb(this.state.applicationId);

    await appVb.load();

    this.appDef = await appVb.findSection(
      SECTIONS.APP_DEFINITION,
      section => section.version == version
    );
  }

  convertPermissionsToSubsections(permissions) {
    let subsections = [];

    Object.keys(permissions).forEach(channelName => {
      let rule = permissions[channelName].join(","),
          channelId = this.getChannelByName(channelName);

      subsections.push({
        rule : rule,
        type : DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES,
        keyId: SECTIONS.KEY_CHANNEL | channelId
      });
    });

    return subsections;
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
  }

  async addVersionUpdate(object) {
    await this.addSection(SECTIONS.APP_LEDGER_VERSION_UPDATE, object);
  }

  async addActor(name, type) {
    let typeId = DATA.ACTOR_TYPES.indexOf(type);

    if(typeId == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_TYPE, type);
    }

    let actorObject = {
      id: this.state.actors.length,
      type: typeId,
      name: name
    };

    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, actorObject);
  }

  async addChannel(name, keyOwner) {
    let keyOwnerId = this.getActorByName(keyOwner);

    let channelObject = {
      id: this.state.channels.length,
      keyOwnerId: keyOwnerId,
      name: name
    };

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, channelObject);
  }

  async addChannelInvitation(channelId, hostId, guestId) {
    let channelKey = await this.getChannelKey(channelId);

    let object = {
      channelId : channelId,
      hostId    : hostId,
      guestId   : guestId,
      channelKey: channelKey
    };

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_INVITATION, object);
  }

  async addActorSubscription(object) {
    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION, object);
  }

  async addChannelData(object, externalDef) {
    let schemaInfo = new Uint8Array(0);

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_DATA, object, externalDef, schemaInfo);
  }

  async addAuthor(object) {
    await this.addSection(SECTIONS.APP_LEDGER_AUTHOR, object);
  }

  async addEndorser(object) {
    await this.addSection(SECTIONS.APP_LEDGER_ENDORSER, object);
  }

  async getChannelKey(channelId) {
    if(this.constructor.isNode()) {
      return null;
    }

    if(!this.channelKeys.has(channelId)) {
      let channelKey;

      if(this.state.channels[channelId].keyOwnerId == this.myId) {
        // we are the key owner of this channel
        channelKey = this.createChannelKey(channelId);
      }
      else {
        // we are not the key owner of this channel: have we been invited to join?
        let invitationRef = this.state.actors[this.myId].invitations.find(obj => obj.channelId == channelId);

        if(!invitationRef) {
          return null;
        }

        let mb = this.getMicroblock(invitationRef.height);

        let section = mb.findSection(
          SECTIONS.APP_LEDGER_CHANNEL_INVITATION,
          obj => obj.channelId == channelId && obj.guestId == this.myId
        );

        channelKey = section.channelKey;
      }

      this.channelKeys.set(channelId, channelKey);
    }
    return this.channelKeys.get(channelId);
  }

  createChannelKey(channelId) {
    let info = uint8.from(
      crypto.derive.PREFIX_CHANNEL_KEY,
      channelId,
      uint8.fromHexa(this.state.genesisSeed)
    );

    return uint8.toHexa(crypto.derive.deriveBitsFromKey(this.constructor.rootPrivateKey, info, 256));
  }

  async identifyMyself(id) {
    let actor = this.state.actors[id],
        publicKey = await this.getActorPublicKey(actor);

    if(actor.type == DATA.ACTOR_END_USER && publicKey == this.myActorPublicKey) {
      this.myPublicKey = publicKey;
      this.myPrivateKey = this.myActorPrivateKey;
      this.myId = id;
      return true;
    }

    if(actor.type != DATA.ACTOR_END_USER && publicKey == this.constructor.rootPublicKey) {
      this.myPublicKey = publicKey;
      this.myPrivateKey = this.constructor.rootPrivateKey;
      this.myId = id;
      return true;
    }

    return false;
  }

  async getActorPublicKey(actor) {
    switch(actor.type) {
      case DATA.ACTOR_APP_OWNER: {
        let appVb = new applicationVb(this.state.applicationId);

        await appVb.load();

        return await this.getOrganizationKey(appVb.state.organizationId);
      }
      case DATA.ACTOR_ORGANIZATION: {
        return await this.getOrganizationKey(actor.organizationId);
      }
      case DATA.ACTOR_END_USER: {
        return actor.publicKey;
      }
    }
  }

  async getOrganizationKey(orgId) {
    let orgVb = new organizationVb(orgId);

    await orgVb.load();

    return orgVb.state.publicKey;
  }

  getActorByName(name) {
    let id = this.state.actors.findIndex(actor => actor.name == name);

    if(id == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_UNKNOWN_ACTOR, name);
    }

    return id;
  }

  getChannelByName(name) {
    let id = this.state.channels.findIndex(channel => channel.name == name);

    if(id == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_UNKNOWN_CHANNEL, name);
    }

    return id;
  }

  getMessageByName(name) {
    let id = this.appDef.definition.messages.findIndex(msg => msg.name == name);

    if(id == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_UNKNOWN_MESSAGE, name);
    }

    return id;
  }

  async signAsEndorser() {
    await this.addSignature(this.myPrivateKey, SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE, false);
  }

  async signAsAuthor() {
    await this.addSignature(this.myPrivateKey, SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE);
  }

  async updateMyIdentity() {
    if(this.constructor.isNode()) {
      return;
    }

    // if not already done, define our actor key pair (even if we're not an end-user)
    if(!this.myActorPrivateKey) {
      let keyPair = this.constructor.deriveActorKeyPair(this.constructor.rootPrivateKey, this.state.genesisSeed);

      this.myActorPrivateKey = keyPair.privateKey;
      this.myActorPublicKey = keyPair.publicKey;
    }

    // test whether we're already a subscribed actor in this ledger
    if(this.myId == undefined) {
      for(let id in this.state.actors) {
        if(await this.identifyMyself(+id)) {
          break;
        }
      }
    }
  }

  async keyManager(keyId, index, object) {
    await this.updateMyIdentity();

    switch(keyId) {
      case SECTIONS.KEY_INVITATION: {
        let theirId;

        switch(this.myId) {
          case object.hostId: {
            // we are the host -> use the public key of the guest
            theirId = object.guestId;
            break;
          }
          case object.guestId: {
            // we are the guest -> use the public key of the host
            theirId = object.hostId;
            break;
          }
          default: {
            // we are not involved in this invitation
            return null;
          }
        }

        let theirPublicKey = await this.getActorPublicKey(this.state.actors[theirId]);

        return this.getSharedKey(
          this.myPrivateKey,
          theirPublicKey
        );
      }
      case SECTIONS.KEY_CHANNEL: {
        return await this.getChannelKey(index);
      }
    }
    return null;
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.APP_LEDGER_DECLARATION: {
        this.state.applicationId = object.applicationId;
        this.state.version = object.version;
        break;
      }

      case SECTIONS.APP_LEDGER_VERSION_UPDATE: {
        this.state.version = object.version;
        break;
      }

      case SECTIONS.APP_LEDGER_ACTOR_CREATION: {
        if(object.id != this.state.actors.length) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.id);
        }
        if(this.state.actors.indexOf(object.name) != -1) {
          throw new appLedgerError(ERRORS.APP_LEDGER_DUPLICATE_ACTOR, object.name);
        }

        this.state.actors.push({
          name: object.name,
          type: object.type,
          invitations: [],
          subscribed: 0
        });
        break;
      }

      case SECTIONS.APP_LEDGER_CHANNEL_CREATION: {
        if(object.id != this.state.channels.length) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_CHANNEL_ID, object.id);
        }
        if(this.state.channels.indexOf(object.name) != -1) {
          throw new appLedgerError(ERRORS.APP_LEDGER_DUPLICATE_CHANNEL, object.name);
        }

        this.state.channels.push({
          name: object.name,
          keyOwnerId: object.keyOwnerId
        });
        break;
      }

      case SECTIONS.APP_LEDGER_CHANNEL_INVITATION: {
        if(!this.state.actors[object.hostId]) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.hostId);
        }
        if(!this.state.actors[object.guestId]) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.guestId);
        }
        if(!this.state.channels[object.channelId]) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_CHANNEL_ID, object.channelId);
        }

        this.state.actors[object.guestId].invitations.push({
          channelId: object.channelId,
          height: mb.object.header.height
        });
        break;
      }

      case SECTIONS.APP_LEDGER_ACTOR_SUBSCRIPTION: {
        let actor = this.state.actors[object.actorId];

        if(!actor) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.actorId);
        }
        if(actor.subscribed) {
          throw new appLedgerError(ERRORS.APP_LEDGER_ALREADY_SUBSCRIBED, actor.name);
        }

        actor.subscribed = 1;

        switch(actor.type) {
          case DATA.ACTOR_ORGANIZATION: {
            actor.organizationId = object.organizationId;
            break;
          }
          case DATA.ACTOR_END_USER: {
            actor.publicKey = object.publicKey;
            break;
          }
        }
        break;
      }

      case SECTIONS.APP_LEDGER_CHANNEL_DATA: {
        break;
      }

      case SECTIONS.APP_LEDGER_AUTHOR: {
        break;
      }

      case SECTIONS.APP_LEDGER_ENDORSER: {
        break;
      }

      case SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE: {
        let endorserSection = mb.sections.find(section => section.id == SECTIONS.APP_LEDGER_ENDORSER),
            publicKey = await this.getActorPublicKey(this.state.actors[endorserSection.object.endorserId]);

        this.verifySignature(mb, publicKey, object, false, [ SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE ]);
        break;
      }

      case SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE: {
        let authorSection = mb.sections.find(section => section.id == SECTIONS.APP_LEDGER_AUTHOR),
            publicKey = await this.getActorPublicKey(this.state.actors[authorSection.object.authorId]);

        this.verifySignature(mb, publicKey, object);
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_APP_LEDGER]);
        break;
      }
    }
  }

  async getExternalDefinition(sectionObject) {
    if(sectionObject.id == SECTIONS.APP_LEDGER_CHANNEL_DATA) {
      await this.loadApplicationDefinition(this.state.version);

      return this.appDef.definition;
    }
    return null;
  }

  checkStructure(pattern) {
    return SECTIONS.APP_LEDGER_STRUCTURE.test(pattern);
  }
}
