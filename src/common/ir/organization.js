import { VirtualBlockchain } from "./virtualBlockchain.js";
import { CHAIN, SECTIONS } from "./constants/constants.js";

export class Organization extends VirtualBlockchain {
  constructor() {
    super(CHAIN.VB_ORGANIZATION);
  }

  async setDescription(object) {
    await this.addSection(SECTIONS.ORG_DESCRIPTION, object);
  }
}
