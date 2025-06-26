import { CHAIN, SECTIONS } from "../constants/constants";
import { VirtualBlockchain } from "./virtualBlockchain";
import { StructureChecker } from "./structureChecker";
import {ValidatorNodeVBState} from "./types";

export class ValidatorNodeVb extends VirtualBlockchain<ValidatorNodeVBState> {
  constructor({
    provider
  }: any) {
    super({ provider, type: CHAIN.VB_VALIDATOR_NODE });
  }

  protected getInitialState(): ValidatorNodeVBState {
    return {}
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
