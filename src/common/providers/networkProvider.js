import { SCHEMAS } from "../constants/constants.js";
import { Base64 } from "../data/base64.js";
import { Utils } from "../utils/utils.js";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer.js";

export class NetworkProvider {
  constructor(nodeUrl) {
    try {
      new URL(nodeUrl);
    }
    catch(e) {
      throw `invalid node URL`;
    }
    this.nodeUrl = nodeUrl;
  }

  async sendMicroblock(headerData, bodyData) {
    const answer = await this.broadcastTx(Utils.binaryFrom(headerData, bodyData));
    return answer;
  }

  async awaitMicroblockAnchoring(hash) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
      {
        hash
      }
    );
    return answer;
  }

  async getAccountState(accountHash) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_ACCOUNT_STATE,
      {
        accountHash
      }
    );
    return answer;
  }

  async getAccountHistory(accountHash, lastHistoryHash, maxRecords) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
      {
        accountHash,
        lastHistoryHash,
        maxRecords
      }
    );
    return answer;
  }

  async getAccountByPublicKeyHash(publicKeyHash) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
      {
        publicKeyHash
      }
    );
    return answer;
  }

  async getMicroblockInformation(hash) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
      {
        hash
      }
    );
    return answer;
  }

  async getMicroblockBodys(hashes) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
      {
        hashes
      }
    );
    return answer;
  }

  async getVirtualBlockchainUpdate(virtualBlockchainId, knownHeight) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE,
      {
        virtualBlockchainId,
        knownHeight
      }
    );
    return answer;
  }

  async query() {
    throw `attempt to call query() from the generic NetworkProvider class`;
  }

  async broadcastTx(data) {
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "broadcast_tx_sync";
    urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

    return await this.query(urlObject);
  }

  async abciQuery(msgId, msgData) {
    const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
    const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
    const data = serializer.serialize(msgId, msgData);
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "abci_query";
    urlObject.searchParams.append("path", '"/carmentis"');
    urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

    const answer = JSON.parse(await this.query(urlObject));
    const binary = Base64.decodeBinary(answer.data);
    const { type, object } = unserializer.unserialize(binary);

    return object;
  }
}
