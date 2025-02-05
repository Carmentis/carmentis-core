import { ERRORS, ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { organizationVb } from "./vb-organization.js";
import { sectionError, oracleError } from "../errors/error.js";

// ============================================================================================================================ //
//  oracleVb                                                                                                                    //
// ============================================================================================================================ //
export class oracleVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_ORACLE);
  }

  async addDeclaration(object) {
    await this.addSection(SECTIONS.ORACLE_DECLARATION, object);
  }

  async addDescription(object) {
    await this.addSection(SECTIONS.ORACLE_DESCRIPTION, object);
  }

  async addDefinition(object) {
    await this.addSection(SECTIONS.ORACLE_DEFINITION, object);
  }

  async sign() {
    await this.addSignature(this.getKey(SECTIONS.KEY_ROOT, 0), SECTIONS.ORACLE_SIGNATURE);
  }

  async getOrganizationVb() {
    if(!this.state.organizationId) {
      throw new oracleError(ERRORS.ORACLE_MISSING_ORG);
    }

    let vb = new organizationVb();

    await vb.load(this.state.organizationId);

    return vb;
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ORACLE_DECLARATION: {
        let ownerVb = new organizationVb();

        await ownerVb.load(object.organizationId);

        this.state.organizationId = object.organizationId;
        break;
      }

      case SECTIONS.ORACLE_DESCRIPTION: {
        break;
      }

      case SECTIONS.ORACLE_DEFINITION: {
        break;
      }

      case SECTIONS.ORACLE_SIGNATURE: {
        let vb = await this.getOrganizationVb();

        this.verifySignature(mb, vb.state.publicKey, object);
        break;
      }

      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_ORACLE]);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.ORACLE_STRUCTURE.test(pattern);
  }
}
