import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, oracleError } from "../errors/error.js";

// ============================================================================================================================ //
//  oracleVb                                                                                                                    //
// ============================================================================================================================ //
export class oracleVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_ORACLE);
  }

  addSection(sectionId, object) {
    super.addSection(sectionId, object);
    this.updateState(sectionId, object);
  }

  updateState(sectionId, object) {
    switch(sectionId) {
      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_ORACLE]);
        break;
      }
    }
  }
}
