import {describe, expect, test} from '@jest/globals';
import {Provider} from "../common/providers/Provider";
import {KeyedProvider} from "../common/providers/KeyedProvider";
import {MemoryProvider} from "../common/providers/MemoryProvider";
import {Blockchain} from "../common/blockchain/blockchain";
import {IntermediateRepresentation} from "../common/records/intermediateRepresentation";
import {DATA, ECO} from '../common/constants/constants';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {EncoderFactory} from "../common/utils/encoder";
import {Crypto} from "../common/crypto/crypto";
import {Hash} from "../common/entities/Hash";
import {NetworkProvider} from "../common/providers/NetworkProvider";
import {BlockchainFacade} from "../common/providers/BlockchainFacade";
import {PublicationExecutionContext} from "../common/providers/publicationContexts/PublicationExecutionContext";
import {
    AccountPublicationExecutionContext
} from "../common/providers/publicationContexts/AccountPublicationExecutionContext";
import {CMTSToken} from "../common/economics/currencies/token";
import {
    AccountTransferPublicationExecutionContext
} from "../common/providers/publicationContexts/AccountTransferPublicationExecutionContext";
import {
    OrganisationPublicationExecutionContext
} from "../common/providers/publicationContexts/OrganisationPublicationExecutionContext";
import {
    ApplicationPublicationExecutionContext
} from "../common/providers/publicationContexts/ApplicationPublicationExecutionContext";
import {
    RecordPublicationExecutionContext
} from "../common/providers/publicationContexts/RecordPublicationExecutionContext";
import {
    AccountNotFoundForAccountHashError, ApplicationLedgerNotFoundError, ApplicationNotFoundError,
    CarmentisError,
    OrganisationNotFoundError
} from "../common/errors/carmentis-error";
import {RecordDescription} from "../common/blockchain/RecordDescription";

const NODE_URL = "http://localhost:26657";

describe('Chain test', () => {
    const TEST_TIMEOUT = 10000;
    /*
    test("testChain()", async () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const memoryProvider = new MemoryProvider();
        const networkProvider = new NetworkProvider(NODE_URL);
        const keyedProvider = new KeyedProvider(privateKey, memoryProvider, networkProvider);

        let blockchain = new Blockchain(keyedProvider);

        // Testing account
        console.log("creating genesis account");

        let genesisAccount = await blockchain.createGenesisAccount();

        genesisAccount.setGasPrice(ECO.TOKEN);
        let genesisAccountId = await genesisAccount.publishUpdates();

        console.log("genesisAccountId", genesisAccountId);

        console.log("creating test account");

        const testPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const testPublicKey = testPrivateKey.getPublicKey();

        let testAccount = await blockchain.createAccount(genesisAccountId, testPublicKey, 10);

        testAccount.setGasPrice(ECO.TOKEN);
        let testAccountId = await testAccount.publishUpdates();

        console.log("testAccountId", testAccountId);

        console.log("processing transfer #1");

        genesisAccount = await blockchain.loadAccount(genesisAccountId);

        const hexEncoder = EncoderFactory.bytesToHexEncoder();
        await genesisAccount.transfer({
            account: testAccountId.toBytes(),
            amount: 1 * ECO.TOKEN,
            publicReference: "transfer #1",
            privateReference: "private ref."
        });

        genesisAccount.setGasPrice(ECO.TOKEN);
        await genesisAccount.publishUpdates();

        console.log("processing transfer #2");

        genesisAccount = await blockchain.loadAccount(genesisAccountId);

        await genesisAccount.transfer({
            account: testAccountId.toBytes(),
            amount: 2 * ECO.TOKEN,
            publicReference: "transfer #2",
            privateReference: "private ref."
        });

        genesisAccount.setGasPrice(ECO.TOKEN);
        await genesisAccount.publishUpdates();

        console.log("loading back genesis account");

        genesisAccount = await blockchain.loadAccount(genesisAccountId);

        // Testing organization
        console.log("creating organization");

        let organization = await blockchain.createOrganization();

        await organization.setDescription({
            name: "Carmentis SAS",
            city: "Paris",
            countryCode: "FR",
            website: "www.carmentis.io"
        });

        organization.setGasPrice(ECO.TOKEN);
        let organizationId = await organization.publishUpdates();

        console.log("loading back organization");

        organization = await blockchain.loadOrganization(organizationId);

        memoryProvider.clear();
        console.log(await organization.getDescription());
        console.log(await organization.getDescription());

        // Testing application
        console.log("creating application");

        let application = await blockchain.createApplication(organizationId);

        await application.setDescription({
            name: "My Application",
            logoUrl: "http://example.com/logo.png",
            homepageUrl: "http://example.com",
            description: "This is my application."
        });

        application.setGasPrice(ECO.TOKEN);
        let applicationId = await application.publishUpdates();

        console.log("loading back application");

        application = await blockchain.loadApplication(applicationId);
        console.log("declaration", await application.getDeclaration());
        console.log("description", await application.getDescription());

        // Testing application ledger
        const object = {
            applicationId: applicationId.encode(),
            data: {
                firstname: "John",
                lastname: "Doe",
                email: "john.doe@gmail.com"
            },
            actors: [
                { name: "seller" }
            ],
            channels: [
                { name: "mainChannel", public: false }
            ],
            channelAssignations: [
                { channelName: "mainChannel", fieldPath: "this.*" }
            ],
            actorAssignations: [
                { channelName: "mainChannel", actorName: "seller" }
            ],
//          maskableFields: [
//              {
//                  fieldPath: "this.email",
//                  maskedParts: [
//                      { position: 1, length: 7, replacementString: "***" }
//                  ]
//              }
//          ],
            author: "seller"
        };

        const appLedger = await blockchain.getApplicationLedgerFromJson(object);

        appLedger.setGasPrice(ECO.TOKEN);
        const hash = await appLedger.publishUpdates();

        const record = await appLedger.getRecord(1);

        console.log("record at height 1", record);

        const microblockData = appLedger.getMicroblockData();
        console.log("microblockData", microblockData);

        const ledgerProof = await appLedger.exportProof({ author: "John Doe" });
        console.log("exported proof", JSON.stringify(ledgerProof, null, 2));

        const dataFromProof = await blockchain.importApplicationLedgerProof(ledgerProof);
        console.log("imported proof", dataFromProof);

        const importer = blockchain.getMicroblockImporter(microblockData);
        const importStatus = await importer.check();
        console.log(`import: status=${importStatus}, error=${importer.error}`);

        // Testing explorer
        const explorerProvider = new Provider(memoryProvider, networkProvider);

        blockchain = new Blockchain(explorerProvider);

        const explorer = blockchain.getExplorer();

        console.log("explorer.getAccountState / genesis", await explorer.getAccountState(genesisAccountId));
        const accountState = await explorer.getAccountState(testAccountId);
        console.log("explorer.getAccountState / test", accountState);
        console.log("explorer.getAccountHistory / test", await explorer.getAccountHistory(testAccountId, Hash.from(accountState.lastHistoryHash), 50));

        const testPublicKeyHash = Crypto.Hashes.sha256AsBinary(testPublicKey.getPublicKeyAsBytes());
        console.log("explorer.getAccountByPublicKeyHash (valid)", await explorer.getAccountByPublicKeyHash(Hash.from(testPublicKeyHash)));
        console.log("explorer.getAccountByPublicKey (valid)", await explorer.getAccountByPublicKey(testPublicKey));

        try {
          console.log("explorer.getAccountByPublicKeyHash (invalid)");
          await explorer.getAccountByPublicKeyHash(Hash.from("0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"));
        }
        catch(e) {
          console.log(e);
        }

        console.log("explorer.getVirtualBlockchainState", await explorer.getVirtualBlockchainState(genesisAccountId));
        console.log("explorer.getAccounts", await explorer.getAccounts());
    }, TEST_TIMEOUT);

     */

    // init the content
    const nodeUrl = "http://localhost:26657";
    const issuerPrivateKey = MLDSA65PrivateSignatureKey.gen();
    const blockchain = BlockchainFacade.createFromNodeUrlAndPrivateKey(nodeUrl, issuerPrivateKey);

    test("Correct usage of BlockchainFacade", async () => {



        // Testing account
        console.log("creating genesis account");
        // create the genesis account
        const genesisCreationContext = new PublicationExecutionContext();
        const genesisAccountId = await blockchain.createAndPublishGenesisAccount(genesisCreationContext);
        const genesisAccount = await blockchain.loadAccount(genesisAccountId);
        console.log("Genesis account created with id ", genesisAccountId.encode());


        {

            // create a first account
            const firstAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
            const firstAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
            const firstAccountId = await blockchain.createAndPublishAccount(firstAccountCreationContext);
            const firstAccount = await blockchain.loadAccount(firstAccountId);

            // create a second account
            const secondAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
            const secondAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(secondAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.zero())
            const secondAccountId = await blockchain.createAndPublishAccount(secondAccountCreationContext);
            const secondAccount = await blockchain.loadAccount(secondAccountId);

            // proceed to a transfer between the first and the second account
            const transferContext = new AccountTransferPublicationExecutionContext()
                .withTransferToAccountHash(firstAccountPrivateKey, secondAccountId)
                .withAmount(CMTSToken.oneCMTS());
            await blockchain.publishTokenTransfer(transferContext);

            // we get balances of first and second accounts
            const firstAccountBalance = await blockchain.getAccountBalance(firstAccountId);
            const secondAccountBalance = await blockchain.getAccountBalance(secondAccountId);
            expect(firstAccountBalance.equals(secondAccountBalance)).toBeTruthy()
            expect(firstAccountBalance.getAmountAsCMTS()).toEqual(CMTSToken.oneCMTS().getAmountAsCMTS());
        }


        {
            // Testing organization
            const organisationCreationContext = new OrganisationPublicationExecutionContext()
                .withCity("Paris")
                .withCountryCode("FR")
                .withName("Carmentis SAS")
                .withWebsite("www.carmentis.io");
            const organizationId = await blockchain.createAndPublishOrganisation(organisationCreationContext);
            const organisation = await blockchain.loadOrganization(organizationId);
            expect(organisation.getCity()).toEqual("Paris");
            expect(organisation.getCountryCode()).toEqual("FR");
            expect(organisation.getName()).toEqual("Carmentis SAS");
            expect(organisation.getWebsite()).toEqual("www.carmentis.io");

            // Testing application
            const applicationCreationContext = new ApplicationPublicationExecutionContext()
                .withOrganisationId(organizationId)
                .withApplicationName("My application");
            const applicationId = await blockchain.createAndPublishApplication(applicationCreationContext);
            const application = await blockchain.loadApplication(applicationId);
            expect(application.getName()).toEqual("My application");

            // Testing application ledger by submitting two elements
            const data = {
                    firstname: "John",
                    lastname: "Doe",
                    email: "john.doe@gmail.com"
                };
            const object = {
                applicationId: applicationId.encode(),
                data,
                actors: [
                    { name: "seller" }
                ],
                channels: [
                    { name: "mainChannel", public: false }
                ],
                channelAssignations: [
                    { channelName: "mainChannel", fieldPath: "this.*" }
                ],
                actorAssignations: [
                    { channelName: "mainChannel", actorName: "seller" }
                ],
                author: "seller"
            };

            const recordPublicationContext = new RecordPublicationExecutionContext()
                .withGasPrice(CMTSToken.createCMTS(2))
                .withRecord(object);
            const appLedgerId = await blockchain.publishRecord(recordPublicationContext);
            const appLedger = await blockchain.loadApplicationLedger(appLedgerId);
            const recoveredData = await appLedger.getRecordAtHeight(1);
            expect(recoveredData).toEqual(data);


            const secondData = {
                firstname: "Foo",
                lastname: "Bar",
                email: "foo.bar@gmail.com"
            };
            const otherObject: RecordDescription = {
                virtualBlockchainId: appLedgerId.encode(),
                applicationId: applicationId.encode(),
                data: secondData,
                channelAssignations: [
                    { channelName: "mainChannel", fieldPath: "this.*" }
                ],
                actorAssignations: [
                    { channelName: "mainChannel", actorName: "seller" }
                ],
                author: "seller"
            };

            const secondRecordPublicationContext = new RecordPublicationExecutionContext()
                .withGasPrice(CMTSToken.createCMTS(2))
                .withRecord(otherObject);
            await blockchain.publishRecord(secondRecordPublicationContext);
            const secondAppLedger = await blockchain.loadApplicationLedger(appLedgerId);
            expect(await secondAppLedger.getRecordAtHeight(2)).toEqual(secondData);

            // we export the proof
            const proofBuilder = await blockchain.createProofBuilderForApplicationLedger(appLedgerId);
            const proof = await proofBuilder.exportProofForEntireVirtualBlockchain("Gael Marcadet");
            const proofVerificationResult = await blockchain.verifyProofFromJson(proof);
            expect(proofVerificationResult.isVerified()).toBeTruthy();
        }

        {
            // Testing access to all items
            const accounts = await blockchain.getAllAccounts();
            const organisations = await blockchain.getAllOrganisations();
            const applications = await blockchain.getAllApplications();
            const nodes = await blockchain.getAllValidatorNodes();
            expect(accounts).toBeInstanceOf(Array);
            expect(accounts.length).toBeGreaterThanOrEqual(2);
            expect(organisations).toBeInstanceOf(Array);
            expect(organisations.length).toBeGreaterThanOrEqual(1);
            expect(applications).toBeInstanceOf(Array);
            expect(applications.length).toBeGreaterThanOrEqual(1);
            expect(nodes).toBeInstanceOf(Array);
        }







    })

    it('Invalid usage of BlockchainFacade: Unknown account', async () =>  {
        const unknownAccountHash = Hash.from("00000000000000000000000000D788B255BD69B9F3019EF60105F160BE7A73C0");

        // search for unknown account history
        await expect(async () => await blockchain.getAccountHistory(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown account state
        await expect(async () => await blockchain.getAccountState(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown account balance
        await expect(async () => await blockchain.getAccountBalance(unknownAccountHash))
            .rejects
            .toThrow(AccountNotFoundForAccountHashError);

        // search for unknown organisation
        await expect(async () => await blockchain.loadOrganization(unknownAccountHash))
            .rejects
            .toThrow(OrganisationNotFoundError)

        // search for unkown application
        await expect(async () => await blockchain.loadApplication(unknownAccountHash))
            .rejects
            .toThrow(ApplicationNotFoundError)

        // search for unknown application ledger
        await expect(async () => await blockchain.loadApplicationLedger(unknownAccountHash))
            .rejects
            .toThrow(ApplicationLedgerNotFoundError)

    });

    /*
    it('Should fails when creating an (issuer) account with the same key', async () => {
        await expect(async () => {
            const genesisCreationContext = new PublicationExecutionContext();
            const genesisAccountId = await blockchain.createAndPublishGenesisAccount(genesisCreationContext);
        }).rejects.toThrow(CarmentisError);
    });

     */

    it('Should fails for transfer when no enough balance', async () =>  {


        // create a first account
        const genesisAccountId = await blockchain.getAccountHashFromPublicKey(issuerPrivateKey.getPublicKey());
        const firstAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const firstAccountCreationContext = new AccountPublicationExecutionContext()
            .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
            .withSellerAccount(genesisAccountId)
            .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
        const firstAccountId = await blockchain.createAndPublishAccount(firstAccountCreationContext);
        const firstAccount = await blockchain.loadAccount(firstAccountId);

        // create a second account
        const secondAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const secondAccountCreationContext = new AccountPublicationExecutionContext()
            .withBuyerPublicKey(secondAccountPrivateKey.getPublicKey())
            .withSellerAccount(genesisAccountId)
            .withInitialBuyerAccountAmount(CMTSToken.zero())
        const secondAccountId = await blockchain.createAndPublishAccount(secondAccountCreationContext);
        const secondAccount = await blockchain.loadAccount(secondAccountId);

        // proceed to a transfer between the first and the second account
        const transferContext = new AccountTransferPublicationExecutionContext()
            .withTransferToAccountHash(firstAccountPrivateKey, secondAccountId)
            .withAmount(CMTSToken.createCMTS(10000)); // too many tokens transferred here
        await expect(blockchain.publishTokenTransfer(transferContext)).rejects.toThrow(CarmentisError);


    });
});
