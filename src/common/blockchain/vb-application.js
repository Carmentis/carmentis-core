import { ERRORS, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { organizationVb } from "./vb-organization.js";
import * as message from "../paths/message.js";
import { sectionError, applicationError } from "../errors/error.js";

// ============================================================================================================================ //
//  applicationVb                                                                                                               //
// ============================================================================================================================ //
export class applicationVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_APPLICATION);
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

    let vb = new organizationVb();

    await vb.load(this.state.organizationId);

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
    await this.addSignature(this.getKey(SECTIONS.KEY_ROOT, 0, 0), SECTIONS.APP_SIGNATURE);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.APP_DECLARATION: {
        let ownerVb = new organizationVb();

        await ownerVb.load(object.organizationId);

        this.state.organizationId = object.organizationId;
        break;
      }

      case SECTIONS.APP_DESCRIPTION:
      case SECTIONS.APP_DEFINITION: {
        if(!this.state.organizationId) {
          throw new applicationError(ERRORS.APPLICATION_MISSING_ORG);
        }
        break;
      }

      case SECTIONS.APP_SIGNATURE: {
        let vb = await this.getOrganizationVb();

        this.verifySignature(mb, vb.state.publicKey, object);
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
