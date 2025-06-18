import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class ValidatorNodeVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_VALIDATOR_NODE });
  }

  /**
    Update methods
  */

  /**
    Section callbacks
  */

  /**
    Structure check
  */
  checkStructure(microblock) {
    const checker = new StructureChecker(microblock);
  }
}
