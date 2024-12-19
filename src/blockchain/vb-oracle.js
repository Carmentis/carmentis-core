import { ID, SECTIONS } from "../constants/constants.js";
import { virtualBlockchain } from "./virtualBlockchain.js";

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
    }
  }
}
