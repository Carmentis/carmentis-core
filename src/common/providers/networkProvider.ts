import { SCHEMAS } from "../constants/constants";
import { Base64 } from "../data/base64";
import { Utils } from "../utils/utils";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer";
import {
  AccountHash,
  AccountHistory,
  AccountState,
  MicroBlockBodys,
  MicroblockInformation, MsgVirtualBlockchainState, VirtualBlockchainState,
  VirtualBlockchainUpdate
} from "../blockchain/types";
import {ProviderInterface} from "./provider";
import axios from "axios";

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

  async getAccountState(accountHash: Uint8Array) {
    const answer = await this.abciQuery<AccountState>(
      SCHEMAS.MSG_GET_ACCOUNT_STATE,
      {
        accountHash
      }
    );
    return answer;
  }

  async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number) {
    const answer = await this.abciQuery<AccountHistory>(
      SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
      {
        accountHash,
        lastHistoryHash,
        maxRecords
      }
    );
    return answer;
  }

  async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
    const answer = await this.abciQuery<AccountHash>(
      SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
      {
        publicKeyHash
      }
    );
    return answer;
  }

  async getMicroblockInformation(hash: Uint8Array) {
    const answer = await this.abciQuery<MicroblockInformation>(
      SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
      {
        hash
      }
    );
    return answer;
  }

  async getMicroblockBodys(hashes: Uint8Array[]) {
    const answer = await this.abciQuery<MicroBlockBodys>(
      SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
      {
        hashes
      }
    );
    return answer;
  }

  async getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number) {
    const answer = await this.abciQuery<VirtualBlockchainUpdate>(
      SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE,
      {
        virtualBlockchainId,
        knownHeight
      }
    );
    return answer;
  }

  async getVirtualBlockchainState(virtualBlockchainId: any) {
    const answer = await this.abciQuery<MsgVirtualBlockchainState>(
      SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_STATE,
      {
        virtualBlockchainId
      }
    );
    return answer;
  }

  async query(urlObject: any): Promise<{data: string}> {
    return new Promise(async (resolve, reject) => {
      try {
        const response = await axios.post(urlObject, {}, {
          headers: {
            'Content-Type': 'application/json; charset=UTF-8',
            'Accept': 'application/json',
          }
        });
        const data = response.data
        //console.log("Received data", data)
        return resolve(data);
      } catch (e) {
        reject(e);
      }
    })
    //throw `attempt to call query() from the generic NetworkProvider class`;
  }

  async broadcastTx(data: any) {
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "broadcast_tx_sync";
    urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

    return await this.query(urlObject);
  }

  async abciQuery<T = object>(msgId: any, msgData: any): Promise<T> {
    const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
    const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
    const data = serializer.serialize(msgId, msgData);
    const urlObject = new URL(this.nodeUrl);

    urlObject.pathname = "abci_query";
    urlObject.searchParams.append("path", '"/carmentis"');
    urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

    const responseData = await this.query(urlObject);
     const binary = Base64.decodeBinary(responseData.data);
    const { type, object } = unserializer.unserialize(binary);

    if(type == SCHEMAS.MSG_ERROR) {
      // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.... Remove this comment to see the full error message
      throw `Remote error: ${object.error}`;
    }

    return object as T;
  }
}
