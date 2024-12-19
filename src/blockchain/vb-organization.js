import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";

// ============================================================================================================================ //
//  organizationVb                                                                                                              //
// ============================================================================================================================ //
export class organizationVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_ORGANIZATION);
  }

  async addPublicKey(object) {
    await this.addSection(SECTIONS.ORG_PUBLIC_KEY, object);
  }

  async addDescription(object) {
    await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
  }

  async getDescription() {
    return await this.findSection(SECTIONS.ORG_DESCRIPTION);
  }

  async sign() {
    await this.addSignature(this.getKey(SECTIONS.KEY_OPERATOR, 0), SECTIONS.ORG_SIGNATURE);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      case SECTIONS.ORG_PUBLIC_KEY: {
        this.state.publicKey = object.publicKey;
        break;
      }

      case SECTIONS.ORG_SIGNATURE: {
        this.verifySignature(mb, this.state.publicKey, object);
        break;
      }
    }
  }

  checkStructure(pattern) {
    return SECTIONS.ORG_STRUCTURE.test(pattern);
  }
}
