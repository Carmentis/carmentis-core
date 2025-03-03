import { ERRORS, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { organizationVb } from "./vb-organization.js";
import * as message from "../apps/message.js";
import * as appDefinition from "../apps/definition.js";
import { sectionError, applicationError } from "../errors/error.js";

// ============================================================================================================================ //
//  applicationVb                                                                                                               //
// ============================================================================================================================ //
export class applicationVb extends virtualBlockchain {
  constructor(id) {
    super(ID.OBJ_APPLICATION, id);

    this.state.version = 0;
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.APP_DECLARATION, object);
  }

  async addDescription(object) {
    await this.addSection(SECTIONS.APP_DESCRIPTION, object);
  }

  async addDefinition(object) {
    let copy = { ...object };

    copy.definition = message.encodeMessages(copy.definition);

    await this.addSection(SECTIONS.APP_DEFINITION, copy);
  }

  async getOrganizationVb() {
    if(!this.state.organizationId) {
      throw new applicationError(ERRORS.APPLICATION_MISSING_ORG);
    }

    let vb = new organizationVb(this.state.organizationId);

    await vb.load();

    return vb;
  }

  async getDescription(version) {
    return await this.findSection(SECTIONS.APP_DESCRIPTION);
  }

  async getDefinition(version) {
    let object;

    object = await this.findSection(
      SECTIONS.APP_DEFINITION,
      object => version == undefined || object.version == version
    );

    if(object) {
      message.decodeMessages(object.definition);
      return object.definition;
    }

    return undefined;
  }

  async sign() {
    return await this.addSignature(this.constructor.rootPrivateKey, SECTIONS.APP_SIGNATURE);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.APP_DECLARATION: {
        let ownerVb = new organizationVb(object.organizationId);

        await ownerVb.load();

        this.state.organizationId = object.organizationId;
        break;
      }

      case SECTIONS.APP_DESCRIPTION: {
        if(!this.state.organizationId) {
          throw new applicationError(ERRORS.APPLICATION_MISSING_ORG);
        }
        break;
      }

      case SECTIONS.APP_DEFINITION: {
        if(!this.state.organizationId) {
          throw new applicationError(ERRORS.APPLICATION_MISSING_ORG);
        }

        appDefinition.check(object.definition);

        if(object.version != this.state.version + 1) {
          throw new applicationError(ERRORS.APPLICATION_BAD_VERSION, this.state.version + 1, object.version);
        }

        this.state.version++;
        break;
      }

      case SECTIONS.APP_SIGNATURE: {
        let vb = await this.getOrganizationVb();

        this.verifySignature(mb, vb.state.publicKey, object);
        mb.payerPublicKey = vb.state.publicKey;
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_APPLICATION]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.APP_STRUCTURE.test(pattern);
  }
}
