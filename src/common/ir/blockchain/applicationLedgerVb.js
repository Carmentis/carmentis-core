import { CHAIN, SECTIONS } from "../constants/constants.js";
import { VirtualBlockchain } from "./virtualBlockchain.js";
import { StructureChecker } from "./structureChecker.js";

export class ApplicationLedgerVb extends VirtualBlockchain {
  constructor({ provider }) {
    super({ provider, type: CHAIN.VB_APP_LEDGER });
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
