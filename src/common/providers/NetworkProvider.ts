import {SCHEMAS} from "../constants/constants";
import {Base64} from "../data/base64";
import {Utils} from "../utils/utils";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {
    AccountHash,
    AccountHashSchema,
    AccountHistoryInterface,
    AccountStateDTO,
    BlockContentDTO,
    BlockInformationDTO,
    ChainInformationDTO,
    GenesisSnapshotDTO,
    MicroBlockBodys,
    MicroblockInformationSchema,
    MsgVirtualBlockchainState,
    ObjectList,
    ValidatorNodeDTO,
    VirtualBlockchainUpdateInterface
} from "../type/types";
import axios, {AxiosError} from "axios";
import {NodeConnectionRefusedError, NodeEndpointClosedWhileCatchingUpError, NodeError} from "../errors/carmentis-error";
import {CometBFTErrorCode} from "../errors/CometBFTErrorCode";
import {RPCNodeStatusResponseSchema} from "./nodeRpc/RPCNodeStatusResponseSchema";
import {Logger} from "../utils/Logger";
import {IExternalProvider} from "./IExternalProvider";

export class NetworkProvider implements IExternalProvider {
    private logger = Logger.getNetworkProviderLogger();
    private static staticLogger = Logger.getNetworkProviderLogger();
    private readonly nodeUrl: string;

    constructor(nodeUrl: string) {
        this.logger.debug(`NetworkProvider constructor -> nodeUrl: ${nodeUrl}`);
        try {
            new URL(nodeUrl);
        }
        catch(e) {
            throw new Error(`invalid node URL`);
        }
        this.nodeUrl = nodeUrl;
        this.logger.debug(`NetworkProvider constructor <- initialized`);
    }

    async sendSerializedMicroblock(headerData: any, bodyData: any) {
        this.logger.debug(`sendSerializedMicroblock -> headerData: ${JSON.stringify(headerData)}, bodyData: ${JSON.stringify(bodyData)}`);
        const answer = await this.broadcastTx(Utils.binaryFrom(headerData, bodyData));
        this.logger.debug(`sendSerializedMicroblock <- ${JSON.stringify(answer)}`);
        return answer;
    }

    async awaitMicroblockAnchoring(hash: any) {
        this.logger.debug(`awaitMicroblockAnchoring -> hash: ${hash}`);
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
            {
                hash
            }
        );
        this.logger.debug(`awaitMicroblockAnchoring <- ${JSON.stringify(answer)}`);
        return answer;
    }

    async getChainInformation() {
        this.logger.debug(`getChainInformation -> requesting chain information`);
        const answer = await this.abciQuery<ChainInformationDTO>(
            SCHEMAS.MSG_GET_CHAIN_INFORMATION,
            {}
        );
        this.logger.debug(`getChainInformation <- received chain information`);
        return answer;
    }

    async getBlockInformation(height: number) {
        this.logger.debug(`getBlockInformation -> height: ${height}`);
        const answer = await this.abciQuery<BlockInformationDTO>(
            SCHEMAS.MSG_GET_BLOCK_INFORMATION,
            {
                height
            }
        );
        this.logger.debug(`getBlockInformation <- received block information for height ${height}`);
        return answer;
    }

    async getBlockContent(height: number) {
        this.logger.debug(`getBlockContent -> height: ${height}`);
        const answer = await this.abciQuery<BlockContentDTO>(
            SCHEMAS.MSG_GET_BLOCK_CONTENT,
            {
                height
            }
        );
        this.logger.debug(`getBlockContent <- received block content for height ${height}`);
        return answer;
    }

    async getValidatorNodeByAddress(address: Uint8Array) {
        this.logger.debug(`getValidatorNodeByAddress -> address: ${Utils.binaryToHexa(address)}`);
        const answer = await this.abciQuery<ValidatorNodeDTO>(
            SCHEMAS.MSG_GET_VALIDATOR_NODE_BY_ADDRESS,
            {
                address
            }
        );
        this.logger.debug(`getValidatorNodeByAddress <- received validator node data`);
        return answer;
    }

    async getAccountState(accountHash: Uint8Array) {
        this.logger.debug(`getAccountState -> accountHash: ${Utils.binaryToHexa(accountHash)}`);
        const answer = await this.abciQuery<AccountStateDTO>(
            SCHEMAS.MSG_GET_ACCOUNT_STATE,
            {
                accountHash
            }
        );
        this.logger.debug(`getAccountState <- received account state`);
        return answer;
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number) {
        this.logger.debug(`getAccountHistory -> accountHash: ${Utils.binaryToHexa(accountHash)}, lastHistoryHash: ${Utils.binaryToHexa(lastHistoryHash)}, maxRecords: ${maxRecords}`);
        const answer = await this.abciQuery<AccountHistoryInterface>(
            SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
            {
                accountHash,
                lastHistoryHash,
                maxRecords
            }
        );
        this.logger.debug(`getAccountHistory <- received account history`);
        return answer;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        this.logger.debug(`getAccountByPublicKeyHash -> publicKeyHash: ${Utils.binaryToHexa(publicKeyHash)}`);
        const answer = await this.abciQuery<AccountHash>(
            SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
            {
                publicKeyHash
            }
        );
        this.logger.debug(`getAccountByPublicKeyHash <- received account hash {accountHash}`, () => ({
            accountHash: Utils.binaryToHexa(answer.accountHash)
        }));
        return AccountHashSchema.parse(answer);
    }

    async getObjectList(type: number) {
        this.logger.debug(`getObjectList -> type: ${type}`);
        const answer = await this.abciQuery<ObjectList>(
            SCHEMAS.MSG_GET_OBJECT_LIST,
            {
                type
            }
        );
        this.logger.debug(`getObjectList <- received object list (${answer.list.length} elements)`);
        return answer;
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformationSchema | null>  {
        this.logger.debug(`getMicroblockInformation -> hash: ${Utils.binaryToHexa(hash)}`);
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
            {
                hash
            }
        );
        this.logger.debug(`getMicroblockInformation <- received microblock information`);
        return answer;
    }

    async getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroBlockBodys | null>  {
        this.logger.debug(`getMicroblockBodys -> ${hashes.length} hashes: [${hashes.map(h => Utils.binaryToHexa(h)).join(', ')}]`);
        const answer = await this.abciQuery<MicroBlockBodys>(
            SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
            {
                hashes
            }
        );
        this.logger.debug(`getMicroblockBodys <- received microblock bodies (${answer.list.length} elements)`);
        return answer;
    }

    async getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number) {
        this.logger.debug(`getVirtualBlockchainUpdate -> virtualBlockchainId: ${Utils.binaryToHexa(virtualBlockchainId)}, knownHeight: ${knownHeight}`);
        const answer = await this.abciQuery<VirtualBlockchainUpdateInterface>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE,
            {
                virtualBlockchainId,
                knownHeight
            }
        );
        this.logger.debug(`getVirtualBlockchainUpdate <- received virtual blockchain update`);
        return answer;
    }

    async getVirtualBlockchainState(virtualBlockchainId: any) {
        const idStr = virtualBlockchainId instanceof Uint8Array ? Utils.binaryToHexa(virtualBlockchainId) : String(virtualBlockchainId);
        this.logger.debug(`getVirtualBlockchainState -> virtualBlockchainId: ${idStr}`);
        const answer = await this.abciQuery<MsgVirtualBlockchainState>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_STATE,
            {
                virtualBlockchainId
            }
        );
        this.logger.debug(`getVirtualBlockchainState <- received virtual blockchain state`);
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
    }

    async broadcastTx(data: any) {
        const urlObject = new URL(this.nodeUrl);

        this.logger.debug(`broadcastTx -> ${data.length} bytes to ${this.nodeUrl}`);

        urlObject.pathname = "broadcast_tx_sync";
        urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

        const result = await NetworkProvider.query(urlObject);
        this.logger.debug(`broadcastTx <- {*}`, () => ({result}));
        return result;
    }

    async abciQuery<T = object>(msgId: number, msgData: object): Promise<T> {
        this.logger.debug(`abciQuery -> msgId: ${msgId}, msgData: ${JSON.stringify(msgData)}`);
        const result = await NetworkProvider.sendABCIQueryToNodeServer(msgId, msgData, this.nodeUrl);
        this.logger.debug(`abciQuery <- {*}`, () => ({result}));
        return result as T;
    }

    static async sendABCIQueryToNodeServer<T = object>(msgId: any, msgData: any, nodeUrl: string): Promise<T> {
        NetworkProvider.staticLogger.debug(`sendABCIQueryToNodeServer -> msgId: ${msgId}, nodeUrl: ${nodeUrl}`);
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
            const errorMsg = (object as any).error;
            NetworkProvider.staticLogger.debug(`sendABCIQueryToNodeServer <- error: ${errorMsg}`);
            throw new NodeError(`Remote error: ${errorMsg}`);
        }

        NetworkProvider.staticLogger.debug(`sendABCIQueryToNodeServer <- received response for msgId: ${msgId}`);
        return object as T;
    }

    static async sendStatusQueryToNodeServer(nodeUrl: string) {
        NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer -> nodeUrl: ${nodeUrl}`);
        const urlObject = new URL(nodeUrl);
        urlObject.pathname = "status";
        const data  = await NetworkProvider.query(urlObject) as any;
        const parsingResult = RPCNodeStatusResponseSchema.safeParse(data);
        if (parsingResult.success) {
            NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer <- received valid status response`);
            return parsingResult.data;
        }
        NetworkProvider.staticLogger.debug(`sendStatusQueryToNodeServer <- parsing error: ${parsingResult.error.message}`);
        throw new NodeError(parsingResult.error.message);
    }

    async getGenesisSnapshot(): Promise<GenesisSnapshotDTO> {
        this.logger.debug(`getGenesisSnapshot -> requesting genesis snapshot`);
        const result = await NetworkProvider.sendABCIQueryToNodeServer<GenesisSnapshotDTO>(
            SCHEMAS.MSG_GET_GENESIS_SNAPSHOT,
            {},
            this.nodeUrl
        );
        this.logger.debug(`getGenesisSnapshot <- received genesis snapshot`);
        return result;
    }
}
