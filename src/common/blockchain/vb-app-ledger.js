import { ERRORS, DATA, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { applicationVb } from "./vb-application.js";
import * as crypto from "../crypto/crypto.js";
import * as util from "../util/util.js";
import * as uint8 from "../util/uint8.js";
import { sectionError, appLedgerError } from "../errors/error.js";

// ============================================================================================================================ //
//  appLedgerVb                                                                                                                 //
// ============================================================================================================================ //
export class appLedgerVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_APP_LEDGER);

    this.state.actors = [];
    this.state.actorId = 0;
    this.state.channels = [];
    this.state.channelId = 0;
  }

  isEndorserSubscribed(endorserName) {
    let endorser = this.state.actors.find(actor => actor.name == endorserName);

    return !!(endorser && endorser.subscribed);
  }

  setEndorserActorPublicKey(publicKey) {
    this.endorserActorPublicKey = publicKey;
  }

  async generateDataSections(object, processInvitation = true) {
    if(object.appLedgerId) {
      await this.load(object.appLedgerId);
    }

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

    // set our actor key
    this.setActorKey();

    // add new actors
    for(let actor of object.actors) {
      await this.addActor(actor.name, actor.type);
    }

    // add new channels
    for(let channel of object.channels) {
      await this.addChannel(channel.name, channel.keyOwner);
    }

    // load the channel keys
    Object.keys(object.permissions).forEach(channelName => {
      let channelId = this.getChannelByName(channelName);

      this.setChannelKey(channelId);
    });

    // get author and endorser IDs
    let authorId = this.getActorByName(object.author),
        endorserId = this.getActorByName(object.approval.endorser);

    // is the application owner already subscribed?
    if(!this.state.actors[authorId].subscribed) {
      await this.addActorSubscription({
        actorId  : authorId,
        actorType: DATA.ACTOR_APP_OWNER
      });
    }

    // is the endorser already subscribed?
    if(processInvitation && !this.state.actors[endorserId].subscribed) {
      await this.addActorSubscription({
        actorId  : endorserId,
        actorType: DATA.ACTOR_END_USER,
        publicKey: this.endorserActorPublicKey
      });
    }

    // add new invitations
    for(let actorName of Object.keys(object.channelInvitations)) {
      for(let channelName of object.channelInvitations[actorName]) {
        let channelId = this.getChannelByName(channelName),
            guestId = this.getActorByName(actorName);

        if(processInvitation) {
          let theirPublicKey = this.getActorPublicKey(guestId);

          let invitationKey = this.getSharedKey(
            uint8.fromHexa(this.getKey(SECTIONS.KEY_ACTOR, 0, 0)),
            uint8.fromHexa(theirPublicKey)
          );

          this.setKey(SECTIONS.KEY_INVITATION, authorId, guestId, invitationKey);

          await this.addChannelInvitation(channelId, authorId, guestId);
        }
      }
    }

    // load the application definition
    await this.loadApplicationDefinition(object.version);

    // turn the permissions into subsections
    let subsections = [];

    Object.keys(object.permissions).forEach(channelName => {
      let rule = object.permissions[channelName].join(","),
          channelId = this.getChannelByName(channelName);

      subsections.push({
        rule     : rule,
        type     : DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES,
        keyId    : SECTIONS.KEY_CHANNEL,
        keyIndex0: channelId,
        keyIndex1: 0
      });
    });

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

  setActorKey() {
    let info = uint8.from(
      crypto.derive.PREFIX_ACTOR_KEY,
      uint8.fromHexa(this.state.genesisSeed)
    );

    let actorKey = uint8.toHexa(crypto.derive.deriveBitsFromKey(this.rootKey, info, 256));

    this.setKey(SECTIONS.KEY_ACTOR, 0, 0, actorKey);
  }

  async loadApplicationDefinition(version) {
    let appVb = new applicationVb();

    await appVb.load(this.state.applicationId);

    this.appDef = await appVb.findSection(
      SECTIONS.APP_DEFINITION,
      section => section.version == version
    );
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
  }

  async addVersionUpdate(object) {
    await this.addSection(SECTIONS.APP_LEDGER_VERSION_UPDATE, object);
  }

  async addActor(name, type) {
    let typeId = DATA.ACTOR_TYPES.indexOf(type);

    if(type == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_TYPE, type);
    }

    let actorObject = {
      id: this.state.actorId,
      type: type,
      name: name
    };

    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, actorObject);
  }

  async addChannel(name, keyOwner) {
    let keyOwnerId = this.getActorByName(keyOwner);

    let channelObject = {
      id: this.state.channelId,
      keyOwnerId: keyOwnerId,
      name: name
    };

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, channelObject);
  }

  async addChannelInvitation(channelId, hostId, guestId) {
    let object = {
      channelId : channelId,
      hostId    : hostId,
      guestId   : guestId,
      channelKey: this.state.channels[channelId].key
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

  setChannelKey(channelId) {
    let info = uint8.from(
      crypto.derive.PREFIX_CHANNEL_KEY,
      channelId,
      uint8.fromHexa(this.state.genesisSeed)
    );

    this.state.channels[channelId].key = uint8.toHexa(crypto.derive.deriveBitsFromKey(this.rootKey, info, 256));
  }

  getActorPublicKey(actorId) {
    console.log("getActorPublicKey", actorId, this.state.actors);
    return crypto.secp256k1.publicKeyFromPrivateKey(uint8.toHexa(crypto.getRandomBytes(32))); // !!
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
    await this.addSignature(this.getKey(SECTIONS.KEY_ACTOR, 0, 0), SECTIONS.APP_LEDGER_ENDORSER_SIGNATURE);
  }

  async signAsAuthor() {
    await this.addSignature(this.getKey(SECTIONS.KEY_ACTOR, 0, 0), SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE);
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
        if(object.id != this.state.actorId) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.id);
        }
        if(this.state.actors.indexOf(object.name) != -1) {
          throw new appLedgerError(ERRORS.APP_LEDGER_DUPLICATE_ACTOR, object.name);
        }

        this.state.actors.push({
          name: object.name,
          subscribed: 0
        });

        this.state.actorId++;
        break;
      }

      case SECTIONS.APP_LEDGER_CHANNEL_CREATION: {
        if(object.id != this.state.channelId) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_CHANNEL_ID, object.id);
        }
        if(this.state.channels.indexOf(object.name) != -1) {
          throw new appLedgerError(ERRORS.APP_LEDGER_DUPLICATE_CHANNEL, object.name);
        }

        this.state.channels.push({
          name: object.name,
          keyOwnerId: object.keyOwnerId
        });

        this.state.channelId++;
        break;
      }

      case SECTIONS.APP_LEDGER_CHANNEL_INVITATION: {
        if(object.actorId >= this.state.actorId) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_ACTOR_ID, object.actorId);
        }
        if(object.channelId >= this.state.channelId) {
          throw new appLedgerError(ERRORS.APP_LEDGER_BAD_CHANNEL_ID, object.channelId);
        }
        if(!this.constructor.isNode()) {
          this.setKey(
            SECTIONS.KEY_CHANNEL,
            object.channelId,
            0,
            object.channelKey
          );
        }
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

        switch(actor.actorType) {
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
        break;
      }

      case SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE: {
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_APP_LEDGER]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.APP_STRUCTURE.test(pattern);
  }
}
