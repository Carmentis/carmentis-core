import {Hash} from "../entities/Hash";
import {VirtualBlockchainStateWrapper} from "../wrappers/VirtualBlockchainStateWrapper";
import {CMTSToken} from "../economics/currencies/token";
import {AccountState} from "../entities/AccountState";
import {AccountHistoryView} from "../entities/AccountHistoryView";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {CryptographicHash} from "../crypto/hash/hash-interface";
import {MicroBlockInformation} from "../entities/MicroBlockInformation";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Account} from "../blockchain/Account";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {Organization} from "../blockchain/Organization";
import {Application} from "../blockchain/Application";

import {RecordDescription} from "../blockchain/RecordDescription";
import {
    ApplicationDescription, BlockContentDTO,
    BlockInformationDTO,
    ChainInformationDTO,
    OrganizationDescription,
    Proof
} from "../blockchain/types";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {Microblock} from "../blockchain/Microblock";
import {ProofVerificationResult} from "../entities/ProofVerificationResult";
import {RPCNodeStatusResponseType} from "./nodeRpc/RPCNodeStatusResponseType";
import {ChainInformationWrapper} from "../wrappers/ChainInformationWrapper";
import {VirtualBlockchainWrapper} from "../wrappers/VirtualBlockchainWrapper";

export interface BlockchainReader {
    //getMicroBlockHeader(vbId: Hash, height: number): Promise<AbstractMicroBlockHeader>;
    getManyMicroBlock(type: VirtualBlockchainType, hashes: Hash[]): Promise<Microblock[]>;

    getMicroBlock(type: VirtualBlockchainType, hashes: Hash): Promise<Microblock | null>

    getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainStateWrapper>;

    getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken>;

    getAccountState(accountHash: Hash): Promise<AccountState>;

    getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords?: number): Promise<AccountHistoryView>;

    getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme?: CryptographicHash): Promise<Hash>;

    lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash>;

    getVirtualBlockchain(vbId: Hash): Promise<VirtualBlockchainWrapper>;

    getMicroblockInformation(hash: Hash): Promise<MicroBlockInformation>;

    loadApplicationLedger(vbId: Hash): Promise<ApplicationLedger>;

    loadAccount(vbId: Hash): Promise<Account>

    loadValidatorNode(identifier: Hash): Promise<ValidatorNode>;

    loadApplication(identifier: Hash): Promise<Application>;

    loadOrganization(identifierString: Hash): Promise<Organization>;

    getRecord<T = any>(vbId: Hash, height: number, privateKey?: PrivateSignatureKey): Promise<T>

    verifyProofFromJson(proof: Proof): Promise<ProofVerificationResult>;

    getPublicKeyOfOrganization(organizationId: Hash): Promise<PublicSignatureKey>;

    getAllAccounts(): Promise<Hash[]>;

    getAllValidatorNodes(): Promise<Hash[]>;

    getAllOrganizations(): Promise<Hash[]>;

    getAllApplications(): Promise<Hash[]>;

    getNodeStatus(): Promise<RPCNodeStatusResponseType>;

    getChainInformation(): Promise<ChainInformationDTO>;

    getBlockInformation(height: number): Promise<BlockInformationDTO>;

    getBlockContent(height: number): Promise<BlockContentDTO>;

    getValidatorNodeByAddress(address: Uint8Array): Promise<Hash>;
}