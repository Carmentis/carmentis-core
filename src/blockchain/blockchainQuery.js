import { ECO, SCHEMAS } from "../constants/constants.js";
import { schemaSerializer } from "../serializers/serializers.js";
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

  static async getAccountHistory(accountHash, lastHistoryHash, maxRecords = 50) {
    let answer = await this.nodeQuery(
      SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
      {
        accountHash: accountHash,
        lastHistoryHash: lastHistoryHash,
        maxRecords: maxRecords
      }
    );

    for(let entry of answer.list) {
      entry.timestamp = new Date(entry.timestamp * 1000);

      entry.name = ECO.BK_NAMES[entry.type];

      entry.chainReference = schemaSerializer.decode(
        ECO.BK_REF_SCHEMAS[ECO.BK_REFERENCES[entry.type]],
        entry.chainReference
      );
    }

    return answer.list;
  }
}
