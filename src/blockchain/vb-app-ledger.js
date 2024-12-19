import { ERRORS, DATA, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { applicationVb } from "./vb-application.js";
import { appLedgerError } from "../errors/error.js";

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

  async prepareUserApproval(object) {
    if(object.appLedgerId) {
      await this.load(appLedgerId);
    }

    let appVb = new applicationVb();

    await appVb.load(object.applicationId);

    let appDef = await appVb.findSection(
      SECTIONS.APP_DEFINITION,
      section => section.version == object.version
    );

    if(this.getHeight() == 1) {
      await this.addDeclaration({
        applicationId: object.applicationId,
        version: object.version
      });
    }
    else if(this.state.version != object.version) {
      await this.addVersionUpdate({
        version: object.version
      });
    }

    for(let actor of object.actors) {
      await this.addActor(actor);
    }

    let authorId = this.getActorByName(object.author);

    for(let channel of object.channels) {
      await this.addChannel({
        name: channel.name,
        keyOwnerId: this.getActorByName(channel.keyOwner)
      });
    }

    for(let actorName of Object.keys(object.channelInvitations)) {
      for(let channelName of object.channelInvitations[actorName]) {
        let channelId = this.getChannelByName(channelName),
            guestId = this.getActorByName(actorName);

        await this.addChannelInvitation(channelId, authorId, guestId);
      }
    }

    if(!this.state.actors[authorId].subscribed) {
      await this.addSubscription({
        actorId  : authorId,
        actorType: DATA.ACTOR_APP_OWNER
      });
    }

    let subsections = [];

    Object.keys(object.permissions).forEach(channelName => {
      let rule = object.permissions[channelName].join(","),
          channelId = this.getChannelByName(channelName);

      subsections.push([
        rule,
        DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES,
        SECTIONS.KEY_CHANNEL,
        channelId
      ]);
    });

    await this.addChannelData(
      object.fields,
      {
        ...appDef.definition,
        subsections: subsections
      }
    );

    await this.addAuthor({
      authorId: authorId
    });

    await this.addApprover({
      approverId: this.getActorByName(object.approval.approver),
      messageId : this.getMessageByName(appDef, object.approval.message)
    });

    this.updateGas();
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.APP_LEDGER_DECLARATION, object);
  }

  async addVersionUpdate(object) {
    await this.addSection(SECTIONS.APP_LEDGER_VERSION_UPDATE, object);
  }

  async addActor(object) {
    object = {
      id: this.state.actorId,
      ...object
    };

    await this.addSection(SECTIONS.APP_LEDGER_ACTOR_CREATION, object);
  }

  async addChannel(object) {
    object = {
      id: this.state.channelId,
      ...object
    };

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_CREATION, object);
  }

  async addChannelInvitation(channelId, hostId, guestId) {
    let object = {
      channelId : channelId,
      hostId    : hostId,
      guestId   : guestId,
      channelKey: "0".repeat(64) //this.state.channels[channelId].key
    };

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_INVITATION, object);
  }

  async addSubscription(object) {
    await this.addSection(SECTIONS.APP_LEDGER_SUBSCRIPTION, object);
  }

  async addChannelData(object, externalDef) {
    let schemaInfo = new Uint8Array(0);

    await this.addSection(SECTIONS.APP_LEDGER_CHANNEL_DATA, object, externalDef, schemaInfo);
  }

  async addAuthor(object) {
    await this.addSection(SECTIONS.APP_LEDGER_AUTHOR, object);
  }

  async addApprover(object) {
    await this.addSection(SECTIONS.APP_LEDGER_APPROVER, object);
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

  getMessageByName(appDef, name) {
    let id = appDef.definition.messages.findIndex(msg => msg.name == name);

    if(id == -1) {
      throw new appLedgerError(ERRORS.APP_LEDGER_UNKNOWN_MESSAGE, name);
    }

    return id;
  }

  async signAsApprover() {
    await this.addSignature(this.getKey(SECTIONS.KEY_USER, 0), SECTIONS.APP_LEDGER_APPROVER_SIGNATURE);
  }

  async signAsAuthor() {
    await this.addSignature(this.getKey(SECTIONS.KEY_OPERATOR, 0), SECTIONS.APP_LEDGER_AUTHOR_SIGNATURE);
  }

  updateState(mb, ndx, sectionId, object) {
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
            object.channelKey
          );
        }
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.APP_STRUCTURE.test(pattern);
  }
}
