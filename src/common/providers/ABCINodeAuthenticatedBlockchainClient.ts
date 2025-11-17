import {Provider} from "./Provider";
import {NotImplementedError} from "../errors/carmentis-error";
import {KeyedProvider} from "./KeyedProvider";
import {ProviderFactory} from "./ProviderFactory";
import {Hash} from "../entities/Hash";
import {Account} from "../blockchain/Account";
import {Organization} from "../blockchain/Organization";
import {ValidatorNode} from "../blockchain/ValidatorNode";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Application} from "../blockchain/Application";
import {CMTSToken} from "../economics/currencies/token";

import {RecordDescription} from "../blockchain/RecordDescription";
import {PublicSignatureKey} from "../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../crypto/signature/PrivateSignatureKey";
import {
    AbstractPrivateDecryptionKey
} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";
import {AccountCrypto} from "../wallet/AccountCrypto";
import {BlockchainClient} from "./BlockchainClient";
import {ABCINodeUnauthenticatedBlockchainClient} from "./ABCINodeUnauthenticatedBlockchainClient";
import {MemoryProvider} from "./MemoryProvider";

export class ABCINodeAuthenticatedBlockchainClient extends ABCINodeUnauthenticatedBlockchainClient {
    private defaultKeyedProvider: Provider;
    private defaultPrivateKey;

    private constructor(nodeUrl: string, defaultPrivateKey: PrivateSignatureKey) {
        const provider = ProviderFactory.createKeyedProviderExternalProvider(defaultPrivateKey, nodeUrl);
        super(nodeUrl, MemoryProvider.getInstance(), provider)
        this.defaultPrivateKey = defaultPrivateKey;
        this.defaultKeyedProvider = provider
    }

    async createTokenTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash, amount: CMTSToken, publicReference: string, privateReference: string, gasPrice: CMTSToken): Promise<any> {
        const provider = ProviderFactory.createKeyedProviderExternalProvider(sellerPrivateKey, this.nodeUrl);
        const sellerPublicKey = sellerPrivateKey.getPublicKey();
        const sellerAccountId = await provider.getAccountHashByPublicKey(sellerPublicKey);
        const sellerAccount = new Account({provider: provider});
        await sellerAccount._load(sellerAccountId);
        sellerAccount.setGasPrice(gasPrice);
        await sellerAccount.transfer({
            account: buyerAccount.toBytes(),
            amount: amount.getAmountAsAtomic(),
            publicReference,
            privateReference
        });

        await sellerAccount.publishUpdates();
    }

    static createWriter(nodeUrl: string, privateKey: PrivateSignatureKey) {
        return new ABCINodeAuthenticatedBlockchainClient(nodeUrl, privateKey)
    }

    async createGenesisAccount() {
        const account = new Account({provider: this.defaultKeyedProvider});
        await account._createGenesis();
        return account;
    }

    async createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: CMTSToken) {
        const account = new Account({provider: this.defaultKeyedProvider});
        await account._create(sellerAccount.toBytes(), buyerPublicKey, amount.getAmountAsAtomic());
        return account;
    }

    async createOrganization() {
        const organization = new Organization({provider: this.defaultKeyedProvider});
        await organization._create();
        return organization;
    }

    async createValidatorNode(organizationIdentifierString: Hash) {
        const validatorNode = new ValidatorNode({provider: this.defaultKeyedProvider});
        await validatorNode._create(organizationIdentifierString.toBytes());
        return validatorNode;
    }

    async createApplication(organizationIdentifierString: Hash) {
        const application = new Application({provider: this.defaultKeyedProvider});
        await application._create(organizationIdentifierString.toBytes());
        return application;
    }

    async createApplicationLedger(applicationId: Hash, expirationDay: number) {
        const applicationLedger = new ApplicationLedger({provider: this.defaultKeyedProvider});
        applicationLedger.vb.setExpirationDay(expirationDay);
        await applicationLedger._create(applicationId.encode());
        return applicationLedger;
    }

    async createApplicationLedgerFromJson<T = any>(privateDecryptionKey: AbstractPrivateDecryptionKey, object: RecordDescription<T>, expirationDay: number) {
        const applicationLedger = new ApplicationLedger({provider: this.defaultKeyedProvider});
        if (applicationLedger.vb.getHeight() == 0) {
            applicationLedger.vb.setExpirationDay(expirationDay);
        }
        await applicationLedger._processJson(privateDecryptionKey, object);
        return applicationLedger;
    }

    async loadOrganization(organizationId: Hash): Promise<Organization> {
        const organization = new Organization({provider: this.defaultKeyedProvider});
        await organization._load(organizationId.toBytes());
        return organization;
    }

    async loadValidatorNode(validatorNodeId: Hash): Promise<ValidatorNode> {
        const validatorNode = new ValidatorNode({provider: this.defaultKeyedProvider});
        await validatorNode._load(validatorNodeId.toBytes());
        return validatorNode;
    }

    async loadApplication(applicationId: Hash): Promise<Application> {
        const application = new Application({provider: this.defaultKeyedProvider});
        await application._load(applicationId.toBytes());
        return application;
    }
}