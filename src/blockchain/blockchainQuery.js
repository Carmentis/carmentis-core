import { SCHEMAS } from "../constants/constants.js";
import { blockchainCore } from "./blockchainCore.js";

export class blockchainQuery extends blockchainCore {
  static async getAccountState(accountHash) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_ACCOUNT_STATE,
      {
        accountHash: accountHash
      }
    );

    return answer;
  }
}
