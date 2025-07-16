import {Provider} from "./Provider";
import {NotImplementedError} from "../errors/carmentis-error";
import {PrivateSignatureKey, PublicSignatureKey} from "../crypto/signature/signature-interface";
import {KeyedProvider} from "./KeyedProvider";
import {ProviderFactory} from "./ProviderFactory";
import {Hash} from "../entities/Hash";
import {Account} from "../blockchain/Account";
import {Organization} from "../blockchain/Organization";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Application} from "../blockchain/Application";
import {BlockchainWriter} from "./BlockchainWriter";
import {CMTSToken} from "../economics/currencies/token";

import {RecordDescription} from "../blockchain/RecordDescription";
import {BlockchainReader} from "./BlockchainReader";

export class ABCINodeBlockchainWriter implements BlockchainWriter {

    private reader: BlockchainReader;
    private nodeUrl: string;
    private defaultPrivateKey: PrivateSignatureKey;
    private defaultKeyedProvider: Provider;

    private constructor(reader: BlockchainReader, nodeUrl: string, defaultPrivateKey: PrivateSignatureKey) {
        this.reader = reader;
        this.nodeUrl = nodeUrl;
        this.defaultPrivateKey = defaultPrivateKey;
        this.defaultKeyedProvider = ProviderFactory.createKeyedProviderExternalProvider(defaultPrivateKey, nodeUrl);
    }



    async createTokenTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash, amount: CMTSToken, publicReference: string, privateReference: string): Promise<any> {
        const provider = ProviderFactory.createKeyedProviderExternalProvider(sellerPrivateKey, this.nodeUrl);
        const sellerPublicKey = sellerPrivateKey.getPublicKey();
        const sellerAccountId = await provider.getAccountByPublicKey(sellerPublicKey);
        const sellerAccount = new Account({ provider: provider });
        await sellerAccount._load(sellerAccountId.accountHash);

        await sellerAccount.transfer({
            account: buyerAccount.toBytes(),
            amount: amount.getAmountAsAtomic(),
            publicReference,
            privateReference
        });

        await sellerAccount.publishUpdates();
    }

    static createWriter( reader: BlockchainReader, nodeUrl: string, privateKey: PrivateSignatureKey ) {
        return new ABCINodeBlockchainWriter(reader, nodeUrl, privateKey)
    }

    async createGenesisAccount() {
        const account = new Account({ provider: this.defaultKeyedProvider });
        await account._createGenesis();
        return account;
    }

    async createAccount(sellerAccount: Hash, buyerPublicKey: PublicSignatureKey, amount: CMTSToken) {
        const account = new Account({ provider: this.defaultKeyedProvider });
        await account._create(sellerAccount.toBytes(), buyerPublicKey, amount.getAmountAsAtomic());
        return account;
    }


    async createOrganization() {
        const organization = new Organization({ provider: this.defaultKeyedProvider });
        await organization._create();
        return organization;
    }


    async createApplication(organizationIdentifierString: Hash) {
        const application = new Application({ provider: this.defaultKeyedProvider });
        await application._create(organizationIdentifierString.toBytes());
        return application;
    }


    async createApplicationLedger(applicationId: Hash) {
        const applicationLedger = new ApplicationLedger({ provider: this.defaultKeyedProvider });
        await applicationLedger._create(applicationId.encode());
        return applicationLedger;
    }

    async createApplicationLedgerFromJson<T = any>(object: RecordDescription<T>) {
        const applicationLedger = new ApplicationLedger({ provider: this.defaultKeyedProvider });
        await applicationLedger._processJson(object);
        return applicationLedger;
    }

}