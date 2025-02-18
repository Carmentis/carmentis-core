import { ERRORS, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, organizationError } from "../errors/error.js";

// ============================================================================================================================ //
//  organizationVb                                                                                                              //
// ============================================================================================================================ //
export class organizationVb extends virtualBlockchain {
  constructor(id) {
    super(ID.OBJ_ORGANIZATION, id);
  }

  async addPublicKey(object) {
    await this.addSection(SECTIONS.ORG_PUBLIC_KEY, object);
  }

  async addDescription(object) {
    await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
  }

  async addServer(object) {
    await this.addSection(SECTIONS.ORG_SERVER, object);
  }

  async getDescription() {
    return await this.findSection(SECTIONS.ORG_DESCRIPTION);
  }

  async getServer() {
    return await this.findSection(SECTIONS.ORG_SERVER);
  }

  async sign() {
    await this.addSignature(this.constructor.rootPrivateKey, SECTIONS.ORG_SIGNATURE);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ORG_PUBLIC_KEY: {
        this.state.publicKey = object.publicKey;
        break;
      }

      case SECTIONS.ORG_DESCRIPTION: {
        break;
      }

      case SECTIONS.ORG_SERVER: {
        break;
      }

      case SECTIONS.ORG_SIGNATURE: {
        this.verifySignature(mb, this.state.publicKey, object);
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_ORGANIZATION]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.ORG_STRUCTURE.test(pattern);
  }
}
