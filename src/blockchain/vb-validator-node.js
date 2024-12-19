import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";

// ============================================================================================================================ //
//  validatorNodeVb                                                                                                             //
// ============================================================================================================================ //
export class validatorNodeVb extends virtualBlockchain {
  constructor() {
    super(ID.OBJ_VALIDATOR_NODE);
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
