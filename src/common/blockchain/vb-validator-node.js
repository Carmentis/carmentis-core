import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, nodeError } from "../errors/error.js";

// ============================================================================================================================ //
//  validatorNodeVb                                                                                                             //
// ============================================================================================================================ //
export class validatorNodeVb extends virtualBlockchain {
  constructor(id) {
    super(ID.OBJ_VALIDATOR_NODE, id);
  }

  async updateState(mb, ndx, sectionId, object) {
    switch(sectionId) {
      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_VALIDATOR_NODE]);
        break;
      }
    }
  }
}
