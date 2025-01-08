import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";
import { sectionError, appUserError } from "../errors/error.js";

// ============================================================================================================================ //
//  appUserVb                                                                                                                   //
// ============================================================================================================================ //
export class appUserVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_APP_USER);
  }

  addSection(sectionId, object) {
    super.addSection(sectionId, object);
    this.updateState(sectionId, object);
  }

  updateState(sectionId, object) {
    switch(sectionId) {
      default: {
        throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[ID.OBJ_APP_USER]);
        break;
      }
    }
  }
}
