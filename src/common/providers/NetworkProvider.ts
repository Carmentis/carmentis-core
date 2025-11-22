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
import {
    IllegalParameterError,
    NodeConnectionRefusedError,
    NodeEndpointClosedWhileCatchingUpError,
    NodeError
} from "../errors/carmentis-error";
import {CometBFTErrorCode} from "../errors/CometBFTErrorCode";
import {RPCNodeStatusResponseSchema} from "./nodeRpc/RPCNodeStatusResponseSchema";
import {Logger} from "../utils/Logger";
import {IExternalProvider} from "./IExternalProvider";
import {CMTSToken} from "../economics/currencies/token";

export class NetworkProvider implements IExternalProvider {
    private static staticLogger = Logger.getNetworkProviderLogger();
    private logger = NetworkProvider.staticLogger;
    private requestLogger = NetworkProvider.staticLogger.getChild("request");
    private responseLogger = NetworkProvider.staticLogger.getChild("response");

    static createFromUrl(url: string): NetworkProvider {
        const logger = NetworkProvider.staticLogger;
        logger.debug(`NetworkProvider constructor -> nodeUrl: ${url}`);
        try {
            new URL(url);
            return new NetworkProvider(url);
        } catch(e) {
            throw new IllegalParameterError(`Invalid node URL: got ${url}`);
        }
    }

    constructor(private readonly nodeUrl: string) {}

    async sendSerializedMicroblock(headerData: Uint8Array, bodyData: Uint8Array) {
        this.requestLogger.debug(`Sending serialized microblock -> header {headerDataLength} bytes, body {bodyDataLength} bytes`, () => ({
            headerDataLength: headerData.length,
            bodyDataLength: bodyData.length
        }));

        // TODO(microblock): use a centralized manner to construct the tx data
        const serializedMicroblock = Utils.binaryFrom(headerData, bodyData);
        const answer = await this.broadcastTx(serializedMicroblock);

        this.responseLogger.debug(`Received response: <- {data}`, () => ({
            data: answer?.data
        }));
        return answer;
    }

    async awaitMicroblockAnchoring(hash: Uint8Array) {
        this.requestLogger.debug(`Awaiting microblock {hash} to be published...`, () => ({
            hash: Utils.binaryToHexa(hash)
        }));

        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
            {
                hash
            }
        );
        return answer;
    }

    async getChainInformation() {
        this.requestLogger.debug(`Requesting chain information`);

        const answer = await this.abciQuery<ChainInformationDTO>(
            SCHEMAS.MSG_GET_CHAIN_INFORMATION,
            {}
        );

        this.responseLogger.debug(`Received chain information: {answer}`, () => ({
            answer
        }));
        return answer;
    }

    async getBlockInformation(height: number) {
        this.requestLogger.debug(`Requesting block information at height: ${height}`);

        const answer = await this.abciQuery<BlockInformationDTO>(
            SCHEMAS.MSG_GET_BLOCK_INFORMATION,
            {
                height
            }
        );

        this.responseLogger.debug(`Received block information at height ${height}: {answer}`, () => ({
            answer
        }))
        return answer;
    }

    async getBlockContent(height: number) {
        this.requestLogger.debug(`Requesting block content for height ${height}`);

        const answer = await this.abciQuery<BlockContentDTO>(
            SCHEMAS.MSG_GET_BLOCK_CONTENT,
            {
                height
            }
        );

        this.responseLogger.debug(`Received block content for height ${height}: ${answer.microblocks.length} microblocks received`);
        return answer;
    }

    async getValidatorNodeByAddress(address: Uint8Array) {
        this.requestLogger.debug(`Requesting validator node id for address {address}`, () => ({
            address: Utils.binaryToHexa(address)}
        ));

        const answer = await this.abciQuery<ValidatorNodeDTO>(
            SCHEMAS.MSG_GET_VALIDATOR_NODE_BY_ADDRESS,
            {
                address
            }
        );

        this.responseLogger.debug(`Receiving validator node id {id}`, () => ({
            id: Utils.binaryToHexa(address)
        }));
        return answer;
    }

    async getAccountState(accountHash: Uint8Array) {
        this.requestLogger.debug(`Requesting account state for account hash {accountHash}`, () => ({
            accountHash: Utils.binaryToHexa(accountHash)
        }));

        const answer = await this.abciQuery<AccountStateDTO>(
            SCHEMAS.MSG_GET_ACCOUNT_STATE,
            {
                accountHash
            }
        );

        this.responseLogger.debug(`Receiving account state: height={height}, balance={balance}, lastHistoryHash={lastHistoryHash}`, () => {
            const height = answer.height;
            const balance = CMTSToken.createAtomic(answer.balance).toString();
            const lastHistoryHash = Utils.binaryToHexa(answer.lastHistoryHash);
            return {height, balance, lastHistoryHash}
        });
        return answer;
    }

    async getAccountHistory(accountHash: Uint8Array, lastHistoryHash: Uint8Array, maxRecords: number) {
        this.requestLogger.debug(`Requesting account history for account hash: ${Utils.binaryToHexa(accountHash)}, lastHistoryHash: ${Utils.binaryToHexa(lastHistoryHash)}, maxRecords: ${maxRecords}`);

        const answer = await this.abciQuery<AccountHistoryInterface>(
            SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
            {
                accountHash,
                lastHistoryHash,
                maxRecords
            }
        );

        this.responseLogger.debug(`Receiving account history with ${answer.list.length} entries` );
        return answer;
    }

    async getAccountByPublicKeyHash(publicKeyHash: Uint8Array) {
        this.requestLogger.debug(`Requesting account hash by public key hash: ${Utils.binaryToHexa(publicKeyHash)}`);

        const answer = await this.abciQuery<AccountHash>(
            SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
            {
                publicKeyHash
            }
        );

        this.responseLogger.debug(`Received account hash {accountHash}`, () => ({
            accountHash: Utils.binaryToHexa(answer.accountHash)
        }));
        return AccountHashSchema.parse(answer);
    }

    async getObjectList(type: number) {
        this.requestLogger.debug(`Requesting list of objects of type ${type}`);

        const answer = await this.abciQuery<ObjectList>(
            SCHEMAS.MSG_GET_OBJECT_LIST,
            {
                type
            }
        );

        this.responseLogger.debug(`Receiving object lists with ${answer.list.length} elements)`);
        return answer;
    }

    async getMicroblockInformation(hash: Uint8Array): Promise<MicroblockInformationSchema | null>  {
        this.requestLogger.debug(`Requesting microblock information for hash ${Utils.binaryToHexa(hash)}`);

        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION,
            {
                hash
            }
        );

        this.responseLogger.debug(`Received microblock information: header size={headerSize}, vbType={vbType}, vbId={vbId}`, () => ({
            headerSize: answer.header.length,
            vbType: answer.virtualBlockchainType,
            vbId: Utils.binaryToHexa(answer.virtualBlockchainId),
        }));
        return answer;
    }

    async getMicroblockBodys(hashes: Uint8Array[]): Promise<MicroBlockBodys | null>  {
        this.requestLogger.debug(`Requesting microblock bodys for microblock hashes ${hashes.length}`);
        this.requestLogger.debug(`Lisf of requsested hashes: ${hashes}`, () => ({
            hashes: hashes.map(h => Utils.binaryToHexa(h))
        }))

        const answer = await this.abciQuery<MicroBlockBodys>(
            SCHEMAS.MSG_GET_MICROBLOCK_BODYS,
            {
                hashes
            }
        );

        this.responseLogger.debug(`getMicroblockBodys <- {*}`, () => ({count: answer.list.length}));
        return answer;
    }

    async getVirtualBlockchainUpdate(virtualBlockchainId: Uint8Array, knownHeight: number) {
        this.requestLogger.debug(`Request virtual blockchain update for virtualBlockchainId: ${Utils.binaryToHexa(virtualBlockchainId)}, knownHeight: ${knownHeight}`);

        const answer = await this.abciQuery<VirtualBlockchainUpdateInterface>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE,
            {
                virtualBlockchainId,
                knownHeight
            }
        );

        this.responseLogger.debug(`Receiving virtual blockchain update: {answer}`, () => ({
            answer
        }));
        return answer;
    }

    async getVirtualBlockchainState(virtualBlockchainId: Uint8Array) {
        //const idStr = virtualBlockchainId instanceof Uint8Array ? Utils.binaryToHexa(virtualBlockchainId) : String(virtualBlockchainId);
        this.requestLogger.debug(`Requesting virtual blockchain state for vb id {vbId}`, () => ({
            vbId: Utils.binaryToHexa(virtualBlockchainId)
        }));

        const answer = await this.abciQuery<MsgVirtualBlockchainState>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_STATE,
            {
                virtualBlockchainId
            }
        );

        this.responseLogger.debug(`Receiving virtual blockchain state: ${answer.stateData.length} bytes`);
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

        this.logger.info(`broadcastTx -> ${data.length} bytes to ${this.nodeUrl}`);

        urlObject.pathname = "broadcast_tx_sync";
        urlObject.searchParams.append("tx", "0x" + Utils.binaryToHexa(data));

        const result = await NetworkProvider.query(urlObject);
        return result;
    }

    async abciQuery<T = object>(msgId: number, msgData: object): Promise<T> {
        this.requestLogger.debug(`abciQuery for msg id {msgId} and data {msgData}`, () => ({msgId, msgData}));
        const result = await NetworkProvider.sendABCIQueryToNodeServer(msgId, msgData, this.nodeUrl);
        //this.responseLogger.debug(`abciQuery response: `, () => ({result}));
        return result as T;
    }

    static async sendABCIQueryToNodeServer<T = object>(msgId: any, msgData: any, nodeUrl: string): Promise<T> {
        NetworkProvider.staticLogger.debug(`sendABCIQueryToNodeServer -> {*}`, () => ({msgId, nodeUrl}));
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
            this.staticLogger.error("Invalid response type detected:", responseData)
            this.staticLogger.error("rawBase64EncodedResponse: ", rawBase64EncodedResponse);
            throw new NodeError("Invalid response detected")
        }
        const binary = Base64.decodeBinary(rawBase64EncodedResponse);
        const {type, object} = unserializer.unserialize(binary);

        if (type == SCHEMAS.MSG_ERROR) {
            const errorMsg = (object as any).error;
            NetworkProvider.staticLogger.error(`sendABCIQueryToNodeServer <- {*}`, () => ({error: errorMsg}));
            throw new NodeError(`Remote error: ${errorMsg}`);
        }

        NetworkProvider.staticLogger.debug(`sendABCIQueryToNodeServer <- {*}`, () => ({msgId}));
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
        this.requestLogger.debug(`Requesting genesis snapshot`);

        const answer = await NetworkProvider.sendABCIQueryToNodeServer<GenesisSnapshotDTO>(
            SCHEMAS.MSG_GET_GENESIS_SNAPSHOT,
            {},
            this.nodeUrl
        );

        this.responseLogger.debug(`Received genesis snapshots containing {chunksNumber}`, () => ({
            chunksNumber: answer.base64EncodedChunks.length,
        }));
        return answer;
    }
}
