import {Provider} from "./Provider";
import {
    AccountHash,
    AccountHistoryInterface,
    AccountStateDTO,
    MicroblockInformationSchema,
    MsgVirtualBlockchainState,
    Proof
} from "../blockchain/types";
import axios, {AxiosError} from "axios";
import {Utils} from "../utils/utils";
import {MessageSerializer, MessageUnserializer} from "../data/messageSerializer";
import {Base64} from "../data/base64";
import {SCHEMAS} from "../constants/constants";
import {CMTSToken} from "../economics/currencies/token";
import {
    AccountNotFoundForAccountHashError,
    ApplicationLedgerNotFoundError,
    ApplicationNotFoundError, NodeConnectionRefusedError,
    NodeError,
    OrganizationNotFoundError,
    VirtualBlockchainNotFoundError
} from "../errors/carmentis-error";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptoSchemeFactory} from "../crypto/CryptoSchemeFactory";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {BlockchainUtils} from "../blockchain/blockchainUtils";
import {VirtualBlockchainState} from "../entities/VirtualBlockchainState";
import {MicroBlockInformation} from "../entities/MicroBlockInformation";
import {MicroBlockHeaderInterface} from "../entities/MicroBlockHeaderInterface";
import {NodeTranslator} from "../entities/NodeTranslator";
import {Hash} from "../entities/Hash";
import {AccountState} from "../entities/AccountState";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Application} from "../blockchain/Application";
import {Organization} from "../blockchain/Organization";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {BlockchainReader} from "./BlockchainReader";
import {Account} from "../blockchain/Account";
import {MemoryProvider} from "./MemoryProvider";
import {NetworkProvider} from "./NetworkProvider";
import {KeyedProvider} from "./KeyedProvider";
import {ProofVerificationResult} from "../entities/ProofVerificationResult";
import {Microblock} from "../blockchain/Microblock";
import {VB_ACCOUNT, VB_APPLICATION, VB_ORGANIZATION, VB_VALIDATOR_NODE} from "../constants/chain";
import {RPCNodeStatusResponseType} from "./nodeRpc/RPCNodeStatusResponseType";

export class ABCINodeBlockchainReader implements BlockchainReader {
    /**
     * Creates an instance of ABCINodeBlockchainReader from the provided node URL.
     *
     * @param {string} nodeUrl - The URL of the node to connect to.
     * @return {ABCINodeBlockchainReader} A new instance of ABCINodeBlockchainReader initialized with the specified node URL.
     */
    static createFromNodeURL(nodeUrl: string): ABCINodeBlockchainReader {
        const cacheProvider = MemoryProvider.getInstance();
        return new ABCINodeBlockchainReader(nodeUrl, cacheProvider);
    }

    private networkProvider: NetworkProvider;
    private publicProvider: Provider;

    protected constructor(
        private nodeUrl: string,
        private cacheProvider: MemoryProvider
    ) {
        this.networkProvider = new NetworkProvider(nodeUrl);
        this.publicProvider = new Provider(cacheProvider, this.networkProvider);
    }

    getMicroBlockBody(microblockHash: Hash): Promise<void> {
        throw new Error("Method not implemented.");
    }

    async getPublicKeyOfOrganization(organizationId: Hash): Promise<PublicSignatureKey> {
        const organization = await this.loadOrganization(organizationId);
        return organization.getPublicKey();
    }

    async getMicroBlock(type: VirtualBlockchainType, hash: Hash): Promise<Microblock> {
        const info = await this.publicProvider.getMicroblockInformation(hash.toBytes());

        if(info === null) {
          throw new Error("unable to load microblock");
        }

        const bodyList = await this.publicProvider.getMicroblockBodys([ hash.toBytes() ]);

        const microblock = new Microblock(type);
        microblock.load(info.header, bodyList[0].body);

        return microblock;
    }

    async getManyMicroBlock(type: VirtualBlockchainType, hashes: Hash[]): Promise<Microblock[]> {
        return Promise.all(hashes.map(async hash => {
            return this.getMicroBlock(type, hash)
        }))
    }

    async getVirtualBlockchainContent(vbId: Hash){
        const content = await this.publicProvider.getVirtualBlockchainContent(vbId);
        if (content === null || content.state === undefined) throw new NodeError("Invalid response from node")
        const state = NodeTranslator.translateVirtualBlockchainState(vbId, content.state);
        const hashes = content.microblockHashes.map(Hash.from);
        return NodeTranslator.translateVirtualBlockchainUpdate(state, hashes);
    }

    async getMicroblockInformation(hash: Hash): Promise<MicroBlockInformation> {
        const answer = await this.publicProvider.getMicroblockInformation(hash.toBytes());

        if(answer === null) {
            throw new Error("unable to load microblock information");
        }

        // parse the header
        const headerObject: MicroBlockHeaderInterface = BlockchainUtils.decodeMicroblockHeader(answer.header);
        const header = NodeTranslator.translateMicroBlockHeader(headerObject);

        // parse and retrieve virtual blockchain state
        const virtualBlockchainId = Hash.from(answer.virtualBlockchainId);
        const virtualBlockchainState = await this.getVirtualBlockchainState(virtualBlockchainId);

        return NodeTranslator.translateMicroBlockInformation(header, virtualBlockchainState);
    }

    /**
     * Locks the current process until the specified microblock is published.
     *
     * @param {Hash} microblockHash - The hash of the microblock to wait for publishing.
     * @return {Promise<Hash>} A promise that resolves to the virtual blockchain ID where the micro-block is published
     */
    async lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash> {
        const answer = await this.abciQuery<MicroblockInformationSchema>(
            SCHEMAS.MSG_AWAIT_MICROBLOCK_ANCHORING,
            {
                hash: microblockHash.toBytes()
            }
        );
        return Hash.from(answer.virtualBlockchainId);
    }

    private static DEFAULT_MAX_RECORDS_HISTORY = 100;
    async getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords: number= ABCINodeBlockchainReader.DEFAULT_MAX_RECORDS_HISTORY): Promise<AccountHistoryView> {
        // we first search for the account state
        const accountState = await this.getAccountState(accountHash);
        if (accountState.isEmpty()) throw new AccountNotFoundForAccountHashError(accountHash);

        // use the last history hash from the account state if not provided
        let usedLastHistoryHash;
        if (lastHistoryHash === undefined) {
            usedLastHistoryHash = accountState.getLastHistoryHash();
        } else {
            usedLastHistoryHash = lastHistoryHash;
        }

        // search the account
        const answer = await this.abciQuery<AccountHistoryInterface>(
            SCHEMAS.MSG_GET_ACCOUNT_HISTORY,
            {
                accountHash: accountHash.toBytes(),
                lastHistoryHash: usedLastHistoryHash.toBytes(),
                maxRecords
            }
        );
        console.log(`Here is the transactions history for account ${accountHash.encode()}:`, answer)

        // convert the response into transactions
        const transactions = new AccountHistoryView();
        for (const t of answer.list) {
            transactions.setTransactionAtHeight(t.height, t);
        }

        return transactions;
    }

    async getAccountState(accountHash: Hash): Promise<AccountState> {
        const answer = await this.abciQuery<AccountStateDTO>(
            SCHEMAS.MSG_GET_ACCOUNT_STATE,
            {
                accountHash: accountHash.toBytes()
            }
        );
        const state = AccountState.createFromDTO(answer);
        if (state.isEmpty()) throw new AccountNotFoundForAccountHashError(accountHash);
        return state;
    }

    async getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken> {
        const accountState = await this.getAccountState(accountHash);
        return accountState.getBalance();
    }

    async getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme: CryptographicHash = CryptoSchemeFactory.createDefaultCryptographicHash()): Promise<Hash> {
        const answer = await this.abciQuery<AccountHash>(
            SCHEMAS.MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH,
            {
                publicKeyHash: hashScheme.hash(publicKey.getPublicKeyAsBytes())
            }
        );
        return Hash.from(answer.accountHash);
    }

    async getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainState> {
        const answer = await this.abciQuery<MsgVirtualBlockchainState>(
            SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_STATE,
            {
                virtualBlockchainState: vbId.toBytes(),
            }
        );

        const state =  BlockchainUtils.decodeVirtualBlockchainState(answer.stateData);
        return NodeTranslator.translateVirtualBlockchainState(vbId, state);
    }

    /**
     * Loads the application ledger associated with the given VB ID.
     *
     * @param {Hash} vbId - The hash identifier for the application ledger to load.
     * @param provider
     * @return {Promise<ApplicationLedger>} A promise that resolves to an instance of ApplicationLedger after loading.
     */
    async loadApplicationLedger(vbId: Hash, provider: Provider = this.publicProvider): Promise<ApplicationLedger> {
       try {
           const applicationLedger = new ApplicationLedger({ provider });
           await applicationLedger._load(vbId.toBytes());
           return applicationLedger;
       } catch (e) {
           if (e instanceof VirtualBlockchainNotFoundError) {
               throw new ApplicationLedgerNotFoundError(vbId);
           } else {
               throw e
           }
       }
    }

    async loadValidatorNode(identifier: Hash): Promise<ValidatorNode> {
        try {
            const validatorNode = new ValidatorNode({ provider: this.publicProvider });
            await validatorNode._load(identifier.toBytes());
            return validatorNode;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new ApplicationNotFoundError(identifier)
            } else {
                throw e
            }
        }
    }

    async loadApplication(identifier: Hash): Promise<Application> {
       try {
           const application = new Application({ provider: this.publicProvider });
           await application._load(identifier.toBytes());
           return application;
       } catch (e) {
           if (e instanceof VirtualBlockchainNotFoundError) {
               throw new ApplicationNotFoundError(identifier)
           } else {
               throw e
           }
       }
    }

    async loadOrganization(vbId: Hash): Promise<Organization> {
        try {
            const organization = new Organization({ provider: this.publicProvider });
            await organization._load(vbId.toBytes());
            return organization;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new OrganizationNotFoundError(vbId);
            } else {
                throw e
            }
        }

    }

    async loadAccount(identifier: Hash) {
        try {
            const account = new Account({ provider: this.publicProvider });
            await account._load(identifier.toBytes());
            return account;
        } catch (e) {
            if (e instanceof VirtualBlockchainNotFoundError) {
                throw new AccountNotFoundForAccountHashError(identifier);
            } else {
                throw e
            }
        }
    }

    async getRecord<T = any>(vbId: Hash, height: number, privateKey?: PrivateSignatureKey): Promise<T> {
        // decide if we use keyed provider or public provider
        const provider = privateKey !== undefined ? new KeyedProvider(privateKey, this.cacheProvider, this.networkProvider) : this.publicProvider;
        const appLedger = await this.loadApplicationLedger(vbId, provider);
        return appLedger.getRecord(height);
    }

    async verifyProofFromJson(proof: Proof) {

        // import the app ledger
        const appLedger = new ApplicationLedger({ provider: this.publicProvider });
        await appLedger._load(Utils.binaryFromHexa(proof.info.virtualBlockchainIdentifier));
        try {
            const importedProof = await appLedger.importProof(proof);
            return ProofVerificationResult.createSuccessfulProofVerificationResult(appLedger, importedProof);
        } catch (e) {
            if (e instanceof ProofVerificationResult) {
                return ProofVerificationResult.createFailedProofVerificationResult(appLedger)
            } else {
                throw e
            }
        }
    }

    /**
     * Retrieves a list of accounts from the specified chain.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of account objects.
     */
    async getAllAccounts() {
        return await this.getObjectList(VB_ACCOUNT);
    }

    /**
     * Retrieves the list of validator nodes from the specified chain.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of validator node objects.
     */
    async getAllValidatorNodes() {
        return await this.getObjectList(VB_VALIDATOR_NODE);
    }

    /**
     * Retrieves a list of organizations.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of organizations.
     */
    async getAllOrganizations() {
        return await this.getObjectList(VB_ORGANIZATION);
    }

    async getNodeStatus(): Promise<RPCNodeStatusResponseType> {
        return NetworkProvider.sendStatusQueryToNodeServer(this.nodeUrl);
    }

    /**
     * Retrieves a list of applications from the specified chain.
     *
     * @return {Promise<Hash[]>} A promise that resolves to an array of application objects.
     */
    async getAllApplications() {
        return await this.getObjectList(VB_APPLICATION);
    }

    private async getObjectList( objectType: number ): Promise<Hash[]> {
        const response = await this.publicProvider.getObjectList(objectType);
        return response.list.map(Hash.from)
    }

    /*
    private async query(urlObject: string): Promise<{data: string}> {
        return new Promise(async (resolve, reject) => {
            try {
                const response = await axios.post(urlObject, {}, {
                    headers: {
                        'Content-Type': 'application/json; charset=UTF-8',
                        'Accept': 'application/json',
                    }
                });
                const data = response.data
                return resolve(data);
            } catch (e) {
                if (e instanceof AxiosError) {
                    if (e.code === 'ECONNREFUSED') {
                        throw new NodeConnectionRefusedError(urlObject)
                    }
                }
                reject(e);
            }
        })
    }

     */


    private async abciQuery<T = object>(msgId: any, msgData: any): Promise<T> {
        return NetworkProvider.sendABCIQueryToNodeServer(msgId, msgData, this.nodeUrl);
        /*
        const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
        const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
        const data = serializer.serialize(msgId, msgData);

        const params = new URLSearchParams();
        params.append("path", '"/carmentis"');
        params.append("data", "0x" + Utils.binaryToHexa(data));
        const abciUrl = this.nodeUrl.replace(/\/+$/, "") + "/abci_query?" + params.toString();


        const responseData = await this.query(abciUrl);
        const binary = Base64.decodeBinary(responseData.data);
        const { type, object } = unserializer.unserialize(binary);

        if(type == SCHEMAS.MSG_ERROR) {
            // @ts-expect-error TS(2339): Property 'error' does not exist on type '{}'.... Remove this comment to see the full error message
            throw new NodeError(object.error);
        }

        return object as T;

         */
    }
}