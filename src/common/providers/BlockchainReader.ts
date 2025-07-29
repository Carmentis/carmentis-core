import {Hash} from "../entities/Hash";
import {VirtualBlockchainState} from "../entities/VirtualBlockchainState";
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
import {ApplicationDescription, OrganizationDescription, Proof} from "../blockchain/types";
import {VirtualBlockchainUpdate} from "../entities/VirtualBlockchainUpdate";
import {VirtualBlockchainType} from "../entities/VirtualBlockchainType";
import {Microblock} from "../blockchain/Microblock";
import {ProofVerificationResult} from "../entities/ProofVerificationResult";

export interface BlockchainReader {
    //getMicroBlockHeader(vbId: Hash, height: number): Promise<AbstractMicroBlockHeader>;
    getManyMicroBlock(type: VirtualBlockchainType, hashes: Hash[]): Promise<Microblock[]>;
    getMicroBlock(type: VirtualBlockchainType, hashes: Hash): Promise<Microblock>
    getVirtualBlockchainState(vbId: Hash): Promise<VirtualBlockchainState>;
    getBalanceOfAccount(accountHash: Hash): Promise<CMTSToken>;
    getAccountState(accountHash: Hash): Promise<AccountState>;
    getAccountHistory(accountHash: Hash, lastHistoryHash?: Hash, maxRecords?: number): Promise<AccountHistoryView>;
    getAccountByPublicKey(publicKey: PublicSignatureKey, hashScheme?: CryptographicHash): Promise<Hash>;
    lockUntilMicroBlockPublished(microblockHash: Hash): Promise<Hash>;
    getVirtualBlockchainContent(vbId: Hash): Promise<VirtualBlockchainUpdate>;
    getMicroblockInformation(hash: Hash): Promise<MicroBlockInformation>;
    loadApplicationLedger(vbId: Hash): Promise<ApplicationLedger>;
    loadAccount(vbId: Hash): Promise<Account>
    loadValidatorNode(identifier: Hash): Promise<ValidatorNode>;
    loadApplication(identifier: Hash): Promise<Application>;
    loadOrganization(identifierString: Hash): Promise<Organization>;
    getRecord<T = any>(vbId: Hash, height: number, privateKey?: PrivateSignatureKey): Promise<T>
    verifyProofFromJson(proof: Proof): Promise<ProofVerificationResult>;
    getPublicKeyOfOrganisation(organisationId: Hash): Promise<PublicSignatureKey>;
    getAllAccounts(): Promise<Hash[]>;
    getAllValidatorNodes(): Promise<Hash[]>;
    getAllOrganisations(): Promise<Hash[]>;
    getAllApplications(): Promise<Hash[]>;
}