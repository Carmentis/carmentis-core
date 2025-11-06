import {Account} from "../blockchain/Account";
import {Hash} from "../entities/Hash";
import {Organization} from "../blockchain/Organization";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {Application} from "../blockchain/Application";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {CMTSToken} from "../economics/currencies/token";
import {RecordDescription} from "../blockchain/RecordDescription";
import {OrganizationDescription} from "../blockchain/types";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {
    AbstractPrivateDecryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {UnauthenticatedBlockchainClient} from "./UnauthenticatedBlockchainClient";

export interface AuthenticatedBlockchainClient {
    createGenesisAccount(): Promise<Account>;
    createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: CMTSToken): Promise<Account>;
    createOrganization(): Promise<Organization>;
    createValidatorNode(organizationIdentifierString: Hash): Promise<ValidatorNode>;
    createApplication(organizationIdentifierString: Hash): Promise<Application>;
    createApplicationLedger(applicationId: Hash, expirationDay: number): Promise<ApplicationLedger>;
    createApplicationLedgerFromJson<T = any>(privateDecryptionKey: AbstractPrivateDecryptionKey, object: RecordDescription<T>, expirationDay: number): Promise<ApplicationLedger>;
    loadOrganization(organizationId: Hash): Promise<Organization>;
    loadValidatorNode(validatorNodeId: Hash): Promise<ValidatorNode>;
    loadApplication(applicationId: Hash): Promise<Application>;
    createTokenTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash, amount: CMTSToken, publicReference: string, privateReference: string, gasPrice: CMTSToken): Promise<any>;
}