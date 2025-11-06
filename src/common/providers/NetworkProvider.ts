import { SCHEMAS } from "../constants/constants";
import { Base64 } from "../data/base64";
import { Utils } from "../utils/utils";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer";
import {
    AccountHash,
    AccountHistoryInterface,
    AccountStateDTO,
    ChainInformationDTO,
    BlockInformationDTO,
    BlockContentDTO,
    ValidatorNodeDTO,
    MicroBlockBodys,
    MicroblockInformationSchema, MsgVirtualBlockchainState, VirtualBlockchainStateInterface,
    VirtualBlockchainUpdateInterface,
    ObjectList, GenesisSnapshotDTO
} from "../blockchain/types";
import axios, {AxiosError} from "axios";
import {UnauthenticatedBlockchainClient} from "./UnauthenticatedBlockchainClient";
import {
    NodeConnectionRefusedError,
    NodeEndpointClosedWhileCatchingUpError,
    NodeError, NotImplementedError
} from "../errors/carmentis-error";
import {CometBFTErrorCode} from "../errors/CometBFTErrorCode";
import {RPCNodeStatusResponseSchema} from "./nodeRpc/RPCNodeStatusResponseSchema";

export class NetworkProvider {
    nodeUrl: any;
    constructor(nodeUrl: any) {
        try {
            new URL(nodeUrl);
        }
        catch(e) {
            throw new Error(`invalid node URL`);
        }
        this.nodeUrl = nodeUrl;
    }

    async sendMicroblock(headerData: any, bodyData: any) {
        const answer = await this.broadcastTx(Utils.binaryFrom(headerData, bodyData));
        return answer;
    }

    async awaitMicroblockAnchoring(hash: any) {
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
            {
                hash
            }
        );
        return answer;
    }

    async getChainInformation() {
        const answer = await this.abciQuery<ChainInformationDTO>(
            SCHEMAS.MSG_GET_CHAIN_INFORMATION,
            {}
        );
        return answer;
    }

    async getBlockInformation(height: number) {
        const answer = await this.abciQuery<BlockInformationDTO>(
            SCHEMAS.MSG_GET_BLOCK_INFORMATION,
            {
                height
            }
        );
        return answer;
    }

    async getBlockContent(height: number) {
        const answer = await this.abciQuery<BlockContentDTO>(
            SCHEMAS.MSG_GET_BLOCK_CONTENT,
            {
                height
            }
        );
        return answer;
    }

    async getValidatorNodeByAddress(address: Uint8Array) {
        const answer = await this.abciQuery<ValidatorNodeDTO>(
            SCHEMAS.MSG_GET_VALIDATOR_NODE_BY_ADDRESS,
            {
                address
            }
        );
        return answer;
    }

    async getAccountState(accountHash: Uint8Array) {
        const answer = await this.abciQuery<AccountStateDTO>(
            SCHEMAS.MSG_GET_ACCOUNT_STATE,
            {
                accountHash
            }
        );
        return answer;
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number) {
        const answer = await this.abciQuery<AccountHistoryInterface>(
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

    async getObjectList(type: number) {
        const answer = await this.abciQuery<ObjectList>(
            SCHEMAS.MSG_GET_OBJECT_LIST,
            {
                type
            }
        );
        return answer;
    }

    async getMicroblockInformation(hash: Uint8Array) {
        const answer = await this.abciQuery<MicroblockInformationSchema>(
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
        const answer = await this.abciQuery<VirtualBlockchainUpdateInterface>(
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

    /*
    private static async query(urlObject: any): Promise<any> {
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

     */

    private static async query(urlObject: any): Promise<{data: string}> {
        try {
            const response = await axios.post(urlObject, {}, {
                headers: {
                    'Content-Type': 'application/json; charset=UTF-8',
                    'Accept': 'application/json',
                }
            });
            const data = response.data
            return data;
        } catch (e) {
            if (e instanceof AxiosError) {
                // connection refused
                if (e.code === 'ECONNREFUSED') {
                    throw new NodeConnectionRefusedError(urlObject)
                }

                // internal server error
                if (e.status === 500) {
                    const cometError = e?.response?.data?.error?.code;
                    if (cometError) {
                        switch (cometError) {
                            case CometBFTErrorCode.ENDPOINT_CLOSED_WHILE_NODE_IS_CATCHING_UP:
                                throw new NodeEndpointClosedWhileCatchingUpError()
                        }
                    }
                    //if (e.response.data.error.code === CometBFTErrorCode.ENDPOINT_CLOSED_WHILE_NODE_IS_CATCHING_UP)
                    throw new NodeError("Internal error in the node")
                }

            }
            throw e
        }
        /*
        return new Promise(async (resolve, reject) => {

        })

         */
    }

    async broadcastTx(data: any) {
        const urlObject = new URL(this.nodeUrl);

        console.log(`broadcastTx -> ${data.length} bytes to ${this.nodeUrl}`);

        urlObject.pathname = "broadcast_tx_sync";
        urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

        return await NetworkProvider.query(urlObject);
    }

    async abciQuery<T = object>(msgId: any, msgData: any): Promise<T> {
        return NetworkProvider.sendABCIQueryToNodeServer(msgId, msgData, this.nodeUrl);
    }

    static async sendABCIQueryToNodeServer<T = object>(msgId: any, msgData: any, nodeUrl: string): Promise<T> {
        const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
        const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
        const data = serializer.serialize(msgId, msgData);
        const urlObject = new URL(nodeUrl);

        urlObject.pathname = "abci_query";
        urlObject.searchParams.append("path", '"/carmentis"');
        urlObject.searchParams.append("data", "0x" + Utils.binaryToHexa(data));

        const responseData = await NetworkProvider.query(urlObject);
        //const binary = Base64.decodeBinary(responseData.data);
        // @ts-ignore
        const rawBase64EncodedResponse = responseData?.result?.response?.value;
        if (typeof rawBase64EncodedResponse !== "string") {
            console.error("Invalid response type detected:", responseData)
            console.log("rawBase64EncodedResponse: ", rawBase64EncodedResponse);
            throw new NodeError("Invalid response detected")
        }
//      console.error(`Unserializing ${rawBase64EncodedResponse}`) // TODO: remove this log
        const binary = Base64.decodeBinary(rawBase64EncodedResponse);
        const { type, object } = unserializer.unserialize(binary);

        if(type == SCHEMAS.MSG_ERROR) {
            // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.... Remove this comment to see the full error message
            throw new NodeError(`Remote error: ${object.error}`);
        }

        return object as T;
    }

    static async sendStatusQueryToNodeServer(nodeUrl: string) {
        const urlObject = new URL(nodeUrl);
        urlObject.pathname = "status";
        const data  = await NetworkProvider.query(urlObject) as any;
        const parsingResult = RPCNodeStatusResponseSchema.safeParse(data);
        if (parsingResult.success) {
            return parsingResult.data;
        }
        throw new NodeError(parsingResult.error.message);
    }

    static async sendBlockByHeightQueryToNodeServer(nodeUrl: string, blockHeight: number) {
        const urlObject = new URL(nodeUrl);
        urlObject.pathname = "block";
        urlObject.searchParams.append("height", blockHeight.toString());
        const data  = await NetworkProvider.query(urlObject) as any;
        throw new NotImplementedError();
        /*
        const parsingResult = RPCNodeStatusResponseSchema.safeParse(data);
        if (parsingResult.success) {
            return parsingResult.data;
        }
        throw new NodeError(parsingResult.error.message);

         */
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotDTO> {
        return NetworkProvider.sendABCIQueryToNodeServer(
            SCHEMAS.MSG_GET_GENESIS_SNAPSHOT,
            {},
            this.nodeUrl
        )
    }
}
