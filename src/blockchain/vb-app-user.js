import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";

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
    }
  }
}
