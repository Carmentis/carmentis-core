import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";

export class ValidatorNodeVb extends VirtualBlockchain {
  constructor({
    provider
  }: any) {
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
  checkStructure(microblock: any) {
    const checker = new StructureChecker(microblock);
  }
}
