import { SCHEMAS } from "../constants/constants";
import { Base64 } from "../data/base64";
import { Utils } from "../utils/utils";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer";

export class NetworkProvider {
  nodeUrl: any;
  constructor(nodeUrl: any) {
    try {
      new URL(nodeUrl);
    }
    catch(e) {
      throw `invalid node URL`;
    }
    this.nodeUrl = nodeUrl;
  }

  async sendMicroblock(headerData: any, bodyData: any) {
    const answer = await this.broadcastTx(Utils.binaryFrom(headerData, bodyData));
    return answer;
  }

  async awaitMicroblockAnchoring(hash: any) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
      {
        hash
      }
    );
    return answer;
  }

  async getAccountState(accountHash: any) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_ACCOUNT_STATE,
      {
        accountHash
      }
    );
    return answer;
  }

  async getAccountHistory(accountHash: any, lastHistoryHash: any, maxRecords: any) {
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

  async getAccountByPublicKeyHash(publicKeyHash: any) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
      {
        publicKeyHash
      }
    );
    return answer;
  }

  async getMicroblockInformation(hash: any) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
      {
        hash
      }
    );
    return answer;
  }

  async getMicroblockBodys(hashes: any) {
    const answer = await this.abciQuery(
      SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
      {
        hashes
      }
    );
    return answer;
  }

  async getVirtualBlockchainUpdate(virtualBlockchainId: any, knownHeight: any) {
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

  async broadcastTx(data: any) {
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "broadcast_tx_sync";
    urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

    // @ts-expect-error TS(2554): Expected 0 arguments, but got 1.
    return await this.query(urlObject);
  }

  async abciQuery(msgId: any, msgData: any) {
    const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
    const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
    const data = serializer.serialize(msgId, msgData);
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "abci_query";
    urlObject.searchParams.append("path", '"/carmentis"');
    urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

    // @ts-expect-error TS(2345): Argument of type 'void' is not assignable to param... Remove this comment to see the full error message
    const answer = JSON.parse(await this.query(urlObject));
    const binary = Base64.decodeBinary(answer.data);
    const { type, object } = unserializer.unserialize(binary);

    return object;
  }
}
