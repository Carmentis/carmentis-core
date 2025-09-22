import {Account} from "../blockchain/Account";
import {Hash} from "../entities/Hash";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {Organization} from "../blockchain/Organization";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {Application} from "../blockchain/Application";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {CMTSToken} from "../economics/currencies/token";
import {RecordDescription} from "../blockchain/RecordDescription";
import {OrganizationDescription} from "../blockchain/types";

export interface BlockchainWriter {
    createGenesisAccount(): Promise<Account>;
    createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: CMTSToken): Promise<Account>;
    createOrganization(): Promise<Organization>;
    createValidatorNode(organizationIdentifierString: Hash): Promise<ValidatorNode>;
    createApplication(organizationIdentifierString: Hash): Promise<Application>;
    createApplicationLedger(applicationId: Hash, expirationDay: number): Promise<ApplicationLedger>;
    createApplicationLedgerFromJson<T = any>(object: RecordDescription<T>, expirationDay: number): Promise<ApplicationLedger>;
    loadOrganization(organizationId: Hash): Promise<Organization>;
    loadValidatorNode(validatorNodeId: Hash): Promise<ValidatorNode>;
    loadApplication(applicationId: Hash): Promise<Application>;

    /*
    sendMicroblock(...args: any[]): Promise<any>;
    setMicroblockInformation(...args: any[]): Promise<any>;
    setMicroblockBody(...args: any[]): Promise<any>;
    setVirtualBlockchainState(...args: any[]): Promise<any>;
     */
    createTokenTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash, amount: CMTSToken, publicReference: string, privateReference: string, gasPrice: CMTSToken): Promise<any>;
}