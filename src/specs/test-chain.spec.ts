import {describe, expect} from '@jest/globals';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {Hash} from "../common/entities/Hash";
import {
    AccountNotFoundForAccountHashError,
    ApplicationLedgerNotFoundError,
    OrganizationNotFoundError,
    VirtualBlockchainNotFoundError
} from "../common/errors/carmentis-error";
import {MlKemPrivateDecryptionKey} from "../common/crypto/encryption/public-key-encryption/MlKemPrivateDecryptionKey";
import {CryptoEncoderFactory} from "../common/crypto/CryptoEncoderFactory";
import {ProviderFactory} from "../common/providers/ProviderFactory";
import {Secp256k1PrivateSignatureKey} from "../common/crypto/signature/secp256k1";
import {Logger} from "../common/utils/Logger";
import {Microblock} from "../common/blockchain/microblock/Microblock";
import {CMTSToken} from "../common/economics/currencies/token";

const NODE_URL = "http://localhost:26657";

describe('Chain test', () => {
    const TEST_TIMEOUT = 45000;

    // init the content
    const nodeUrl = "http://localhost:26657";
    const sigEncoder = CryptoEncoderFactory.defaultStringSignatureEncoder();
    const issuerPrivateKey = sigEncoder.decodePrivateKey('SIG:SECP256K1:SK{2e3b5c0e850dce63adb3ee46866c691d2731d92ad8108fbf8cd8c86f6a124bb6}');
    console.log(`Issuer public key: ${sigEncoder.encodePublicKey(issuerPrivateKey.getPublicKey())}`)
    const provider = ProviderFactory.createInMemoryProviderWithExternalProvider(nodeUrl);


    let genesisAccountId: Hash;
    beforeAll(async () => {
        // we load the genesis account information
        const accounts = await provider.getAllAccounts();
        expect(accounts.length).toBeGreaterThan(0);
        genesisAccountId = await provider.getAccountHashFromPublicKey(issuerPrivateKey.getPublicKey());
    });

    it("creating an account", async () => {
        const firstAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
        const firstAccountCreationMb = Microblock.createGenesisAccountMicroblock();
        firstAccountCreationMb.addAccountCreationSection({
            amount: CMTSToken.zero().getAmountAsAtomic(),
            sellerAccount: genesisAccountId.toBytes()
        });
        firstAccountCreationMb.addAccountPublicKeySection({
            publicKey: firstAccountPrivateKey.getPublicKey().getPublicKeyAsBytes()
        })
        firstAccountCreationMb.setFeesPayerAccount(genesisAccountId.toBytes());
        const signingData = firstAccountCreationMb.serializeForSigning(true);
        const signature = firstAccountPrivateKey.sign(signingData);
        firstAccountCreationMb.addAccountSignatureSection({ signature })
        console.log(firstAccountCreationMb.toString())
        provider.publishMicroblock( firstAccountCreationMb );

        expect(1).toEqual(1)
    })



    it("Works correctly when valid usage of BlockchainFacade", async () => {


        // set up the logger
        await Logger.enableLogs();

        /* The genesis account is already created during the genesis state: no more creation required
        console.log("creating genesis account");
        // create the genesis account
        const genesisCreationContext = new PublicationExecutionContext();
        const genesisAccountId = await blockchain.publishGenesisAccount(genesisCreationContext);
        const genesisAccount = await blockchain.loadAccount(genesisAccountId);
        expect(genesisAccount).toBeDefined();
        expect(await genesisAccount.isIssuer()).toBeTruthy();
        console.log("Genesis account created with id ", genesisAccountId.encode());
         */




        const amazonPrivDecKey = MlKemPrivateDecryptionKey.gen();
        const deliverPrivSigKey = Secp256k1PrivateSignatureKey.gen();
        const deliverPricDecKey = MlKemPrivateDecryptionKey.gen();

        {
            // create a first account


            /*
            const firstAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
            const firstAccountId = await blockchain.publishAccount(firstAccountCreationContext);
            const firstAccount = await blockchain.loadAccount(firstAccountId);
             */
            /*
            expect(await firstAccount.isIssuer()).toBeFalsy();

            // create a second account
            const secondAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
            const secondAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(secondAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.zero())
            const secondAccountId = await blockchain.publishAccount(secondAccountCreationContext);
            const secondAccount = await blockchain.loadAccount(secondAccountId);
            expect(await secondAccount.isIssuer()).toBeFalsy();

            // proceed to a transfer from the first to the second account
            const transferContext = new AccountTransferPublicationExecutionContext()
                .withTransferToAccountHash(firstAccountPrivateKey, secondAccountId)
                .withAmount(CMTSToken.oneCMTS());
            await blockchain.publishTokenTransfer(transferContext);

            // we get balances of first and second accounts
            const firstAccountBalance = await blockchain.getAccountBalance(firstAccountId);
            const secondAccountBalance = await blockchain.getAccountBalance(secondAccountId);
            {
                const secondAccountHistory = await blockchain.getAccountHistory(secondAccountId);
                expect(secondAccountHistory.getNumberOfTransactions()).toEqual(2);
                expect(secondAccountHistory.containsTransactionAtHeight(1)).toBeTruthy()
                expect(secondAccountHistory.containsTransactionAtHeight(2)).toBeTruthy()
                expect(secondAccountHistory.containsTransactionAtHeight(3)).toBeFalsy()
                const firstTransaction = secondAccountHistory.getTransactionAtHeight(1);
                const secondTransaction = secondAccountHistory.getTransactionAtHeight(2);
                expect(firstTransaction.isPurchase()).toBeTruthy()
                expect(secondTransaction.isReceivedPayment()).toBeTruthy()
                expect(secondTransaction.isPositive()).toBeTruthy()
                expect(secondTransaction.isReceivedIssuance()).toBeFalsy()
                const firstTransactionAmount = firstTransaction.getAmount();
                const secondTransactionAmount = secondTransaction.getAmount();
                expect(secondTransactionAmount.isPositive()).toBeTruthy()
            }

            {
                // we get the history of the first account
                // We expect two transactions: one for account issuing and another for the transfer to the second account
                const firstAccountHistory = await blockchain.getAccountHistory(firstAccountId);
                expect(firstAccountHistory.getNumberOfTransactions()).toEqual(3);
                expect(firstAccountHistory.containsTransactionAtHeight(1)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(2)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(3)).toBeTruthy();
                expect(firstAccountHistory.containsTransactionAtHeight(4)).toBeFalsy();
                const firstTransaction = firstAccountHistory.getTransactionAtHeight(1);
                const secondTransaction = firstAccountHistory.getTransactionAtHeight(2);
                const thirdTransaction = firstAccountHistory.getTransactionAtHeight(3);
                const firstTransactionAmount = firstTransaction.getAmount();
                const secondTransactionAmount = secondTransaction.getAmount();
                expect(secondTransactionAmount.isPositive()).toBeFalsy()
                expect(thirdTransaction.isPaidFees()).toBeTruthy();
            }
            */
        }

        {
            /*
            // Testing organization
            const organizationCreationContext = new OrganizationPublicationExecutionContext()
                .withCity("Paris")
                .withCountryCode("FR")
                .withName("Carmentis SAS")
                .withWebsite("www.carmentis.io");
            const organizationId = await blockchain.publishOrganization(organizationCreationContext);
            const organization = await blockchain.loadOrganization(organizationId);
            expect(organization.getCity()).toEqual("Paris");
            expect(organization.getCountryCode()).toEqual("FR");
            expect(organization.getName()).toEqual("Carmentis SAS");
            expect(organization.getWebsite()).toEqual("www.carmentis.io");
            expect(organization.getPublicKey()).toBeDefined()

            // update organization
            const organizationUpdateContext = new OrganizationPublicationExecutionContext()
                .withExistingOrganizationId(organizationId)
                .withWebsite("https://www.carmentis.io");
            await blockchain.publishOrganization(organizationUpdateContext);
            const updatedOrganization = await blockchain.loadOrganization(organizationId);
            expect(updatedOrganization.getWebsite()).toEqual("https://www.carmentis.io");

            */

            // Testing validator node
            /* The validator set cannot be updated with validators having zero voting power
            {
                const CometPublicKeyType = "tendermint/PubKeyEd25519";
                const CometPublicKey = "a5XTiHqlMwWLDpiBCcSk019gEPx9HAuICx0eouEVpaE=";
                const RpcEndpoint = "http://this-goes-nowhere.com:26667";

                const validatorNodeCreationContext = new ValidatorNodePublicationExecutionContext()
                    .withOrganizationId(organizationId)
                    .withRpcEndpoint(RpcEndpoint)
                    .withCometPublicKeyType(CometPublicKeyType)
                    .withCometPublicKey(CometPublicKey);
                const validatorNodeId = await blockchain.publishValidatorNode(validatorNodeCreationContext);
                const validatorNode = await blockchain.loadValidatorNode(validatorNodeId);
                expect(validatorNode.getCometPublicKeyType()).toEqual(CometPublicKeyType);
                expect(validatorNode.getCometPublicKey()).toEqual(CometPublicKey);
                expect(validatorNode.getRpcEndpoint()).toEqual(RpcEndpoint);

                const validatorNodeNetworkIntegrationPublicationContext = new ValidatorNodeNetworkIntegrationPublicationExecutionContext()
                    .withExistingValidatorNodeId(validatorNodeId)
                    .withVotingPower(10);
                await blockchain.publishValidatorNodeNetworkIntegration(validatorNodeNetworkIntegrationPublicationContext);
                const reloadedValidatorNode = await blockchain.loadValidatorNode(validatorNodeId);
                expect(reloadedValidatorNode.getVotingPower()).toEqual(0);
            }
             */

            /*
            // Testing application
            const applicationCreationContext = new ApplicationPublicationExecutionContext()
                .withOrganizationId(organizationId)
                .withApplicationName("My application");
            const applicationId = await blockchain.publishApplication(applicationCreationContext);
            const application = await blockchain.loadApplication(applicationId);
            expect(application.getName()).toEqual("My application");

            // update the application
            const applicationUpdateContext = new ApplicationPublicationExecutionContext()
                .withExistingApplicationId(applicationId)
                .withApplicationName("My updated application");
            await blockchain.publishApplication(applicationUpdateContext);
            const updatedApplication = await blockchain.loadApplication(applicationId);
            expect(updatedApplication.getName()).toEqual("My updated application");

            {
                // Testing application ledger by submitting two elements
                const data = {
                    firstname: "John",
                    lastname: "Doe",
                    email: "john.doe@gmail.com",
                    phone: "+33 06 12 34 56 78",
                    address: "12 rue de la paix"
                };
                const dataExpectedToBeObtainedByExternal = {}
                const dataExpectedToBeObtainedByAmazon = data;
                const dataExpectedToBeObtainedByDeliver = {
                    firstname: data.firstname,
                    lastname: data.lastname,
                    phone: data.phone,
                    address: data.address
                }

                const object = {
                    applicationId: applicationId.encode(),
                    data,
                    actors: [
                        { name: "amazon" },
                        { name: "deliver" }
                    ],
                    channels: [
                        { name: "userInformationChannel", public: false },
                        { name: "addressInformationChannel", public: false },
                    ],
                    channelAssignations: [
                        { channelName: "userInformationChannel", fieldPath: "this.*" },
                        { channelName: "addressInformationChannel", fieldPath: "this.address" },
                        { channelName: "addressInformationChannel", fieldPath: "this.phone" },
                        { channelName: "addressInformationChannel", fieldPath: "this.firstname" },
                        { channelName: "addressInformationChannel", fieldPath: "this.lastname" },
                    ],
                    actorAssignations: [
                        // no need to create the actor assignations because all (private) channels created here are automatically
                        // associated to the author.
                    ],
                    author: "amazon"
                };



                let provider = ProviderFactory.createKeyedProviderExternalProvider(issuerPrivateKey, NODE_URL);

                const newAppLedger = new ApplicationLedger({provider});
                newAppLedger.setExpirationDurationInDays(365);
                await newAppLedger._processJson(amazonPrivDecKey, object);
                await newAppLedger.subscribeActor(
                    "deliver",
                    deliverPrivSigKey.getPublicKey(),
                    deliverPricDecKey.getPublicKey()
                )
                await newAppLedger.inviteActorOnChannel("deliver", "addressInformationChannel", amazonPrivDecKey)
                newAppLedger.setGasPrice(CMTSToken.createCMTS(2));
                const appLedgerId = await newAppLedger.publishUpdates();

                // reload the application ledger
                let appLedger = new ApplicationLedger({provider});
                await appLedger._load(appLedgerId.toBytes());
                let recoveredData = await appLedger.getRecord(1, amazonPrivDecKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByAmazon);

                // reload the application ledger, this time using an external identity
                const externalSigPrivKey = MLDSA65PrivateSignatureKey.gen();
                const externalPrivKey = MlKemPrivateDecryptionKey.gen();
                const externalProvider = ProviderFactory.createKeyedProviderExternalProvider(externalSigPrivKey, NODE_URL);
                appLedger = new ApplicationLedger({provider: externalProvider});
                await appLedger._load(appLedgerId.toBytes());
                recoveredData = await appLedger.getRecord(1, externalPrivKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByExternal);

                console.log("----------------------[ Deliver ]-----------------------")
                // reload the application ledger, this time using the deliver identity
                const deliveryProvider = ProviderFactory.createKeyedProviderExternalProvider(deliverPrivSigKey, NODE_URL)
                appLedger = new ApplicationLedger({provider: deliveryProvider});
                await appLedger._load(appLedgerId.toBytes());
                recoveredData = await appLedger.getRecord(1, deliverPricDecKey);
                expect(recoveredData).toEqual(dataExpectedToBeObtainedByDeliver);

            }
            */
            // -------------------------------------------------------------------------------------------------
            // ACPR
            // -------------------------------------------------------------------------------------------------
            {
                const ACPRPersonSchemaData = {
                    "$schema": "https://json-schema.org/draft/2020-12/schema",
                    "$id": "https://raw.githubusercontent.com/Blitz-BS/blitzCollection/refs/heads/main/json_schema/person.schema.json",
                    "title": "Personne",
                    "description": "Personne physique ou morale ou groupement",
                    "oneOf" : [
                        {
                            "required": ["reference"],
                            "additionalProperties": false,
                            "type": "object",
                            "properties": {
                                "$schema": {
                                    "title" : "Schéma JSON",
                                    "description" : "URL du schéma",
                                    "type": "string",
                                    "format": "uri"
                                },
                                "reference" : {
                                    "title" : "Référence",
                                    "description" : "Référence de la personne chez le client de la société de recouvrement. Cette référence doit être unique pour un client donné. Ce schéma est utilisé quand la référence à une personne déjà connue en base suffit.",
                                    "type": "string"
                                }
                            }
                        },{
                            "required": ["reference", "name", "personCategory"],
                            "type": "object",
                            "properties": {
                                "$schema": {
                                    "title" : "Schéma JSON",
                                    "description" : "URL du schéma",
                                    "type": "string",
                                    "format": "uri"
                                },
                                "reference" : {
                                    "title" : "Référence",
                                    "description" : "Référence de la personne chez le client de la société de recouvrement. Cette référence doit être unique pour un client et un créancier donné.",
                                    "type": "string"
                                },
                                "name" : {
                                    "title" : "Nom",
                                    "description" : "Exemple : Jean Dupont ou Dupont & Cie",
                                    "type": "string"
                                },
                                "personCategory" : {
                                    "title" : "Catégorie de personne",
                                    "description" : "Catégorie de personne : personne morale, personne physique ou administration",
                                    "enum" : ["legalPerson", "naturalPerson", "administration"]
                                },
                                "ability" : {
                                    "title" : "Compétence",
                                    "description" : "Compétence du tiers à agir",
                                    "enum" : ["bailiff", "administrator", "attorney", "investigator", "court", "collectionCompany", "agent", "clientAgency", "none"],
                                    "default" : "none"
                                },
                                "companyInfo" : {
                                    "title" : "Informations sur une entreprise",
                                    "description" : "Informations utiles sur une entreprise",
                                    "$ref": "./companyInfo.schema.json"
                                },
                                "contacts" : {
                                    "title" : "Contacts",
                                    "description" : "Contacts de la personne",
                                    "type": "array",
                                    "items": {
                                        "allOf": [
                                            { "$ref" : "./contact.schema.json" },
                                            {
                                                "type" : "object",
                                                "properties": {
                                                    "role" : {
                                                        "title" : "Rôle du contact pour la personne physique ou morale",
                                                        "description" : "Exemple : commercial, responsable administratif, épouse, époux",
                                                        "type": "string",
                                                        "maxLength": 20
                                                    }
                                                }
                                            }
                                        ],
                                        "unevaluatedProperties": false
                                    }
                                },
                                "bankAccount" : {
                                    "title" : "Compte bancaire",
                                    "description" : "Compte bancaire",
                                    "$ref": "./bankAccount.schema.json"
                                }
                            }
                        }
                    ]
                }

                /*
                const record = {

                }

                let provider = ProviderFactory.createKeyedProviderExternalProvider(issuerPrivateKey, NODE_URL);

                const newAppLedger = new ApplicationLedger({provider});
                newAppLedger.setExpirationDurationInDays(365);
                await newAppLedger._processJson(amazonPrivDecKey, ACPRPersonSchemaData);
                await newAppLedger.inviteActorOnChannel("deliver", "addressInformationChannel", amazonPrivDecKey)
                newAppLedger.setGasPrice(CMTSToken.createCMTS(2));
                const appLedgerId = await newAppLedger.publishUpdates();

                 */
            }





            /*
            const recordPublicationContext = new RecordPublicationExecutionContext()
                .withGasPrice(CMTSToken.createCMTS(2))
                .withExpirationIn(365)
                .withRecord(object);
            const appLedgerId = await blockchain.publishRecord(firstAccountPrivateDecryptionKey, recordPublicationContext, true);
            const appLedger = await blockchain.loadApplicationLedger(appLedgerId);
            const recoveredData = await appLedger.getRecordAtHeight(1, firstAccountPrivateDecryptionKey);
            expect(recoveredData).toEqual({
                email: data.email,
                phone: data.phone
            });

             */

            /* TODO: need fix
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
            await blockchain.publishRecord(firstAccountPrivateDecryptionKey, secondRecordPublicationContext);
            const secondAppLedger = await blockchain.loadApplicationLedger(appLedgerId);
            expect(await secondAppLedger.getRecordAtHeight(2, firstAccountPrivateDecryptionKey)).toEqual(secondData);

             */

            /*
            // we export the proof
            const proofBuilder = await blockchain.createProofBuilderForApplicationLedger(appLedgerId);
            const proof = await proofBuilder.exportProofForEntireVirtualBlockchain("Gael Marcadet", firstAccountPrivateDecryptionKey);
            const proofVerificationResult = await blockchain.verifyProofFromJson(proof);
            expect(proofVerificationResult.isVerified()).toBeTruthy();

             */
        }

        /*
        {
            // Testing access to all items
            const accounts = await blockchain.getAllAccounts();
            const organizations = await blockchain.getAllOrganizations();
            const applications = await blockchain.getAllApplications();
            const nodes = await blockchain.getAllValidatorNodes();

            expect(accounts).toBeInstanceOf(Array);
            expect(accounts.length).toBeGreaterThanOrEqual(2);
            expect(organizations).toBeInstanceOf(Array);
            expect(organizations.length).toBeGreaterThanOrEqual(1);
            expect(applications).toBeInstanceOf(Array);
            expect(applications.length).toBeGreaterThanOrEqual(1);
            expect(nodes).toBeInstanceOf(Array);
            expect(nodes.length).toBeGreaterThanOrEqual(1);
        }

        {
            // Testing first block information
            const firstBlockInformation = await blockchain.getBlockInformation(1);
            expect(firstBlockInformation).toBeDefined();
            expect(firstBlockInformation.anchoredAt()).toBeInstanceOf(Date);
            expect(firstBlockInformation.getBlockHash()).toBeInstanceOf(Hash);

            // Testing access chain information
            const chainInformation = await blockchain.getChainInformation();
            expect(chainInformation).toBeDefined();
            expect(chainInformation.getHeight()).toBeGreaterThanOrEqual(1);
            expect(chainInformation.getLatestPublicationTime().getTime()).toBeLessThan(new Date().getTime());
        }

         */
    }, TEST_TIMEOUT)

    it('Invalid usage of BlockchainFacade: Unknown account', async () =>  {
        /*
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

        // search for unknown organization
        await expect(async () => await blockchain.loadOrganization(unknownAccountHash))
            .rejects
            .toThrow(OrganizationNotFoundError)

        // search for unkown application
        await expect(async () => await blockchain.loadApplication(unknownAccountHash))
            .rejects
            .toThrow(VirtualBlockchainNotFoundError)

        // search for unknown application ledger
        await expect(async () => await blockchain.loadApplicationLedger(unknownAccountHash))
            .rejects
            .toThrow(ApplicationLedgerNotFoundError)

         */

    }, TEST_TIMEOUT);

    /*
    it('Should fails when creating an (issuer) account with the same key', async () => {
        await expect(async () => {
            const genesisCreationContext = new PublicationExecutionContext();
            const genesisAccountId = await blockchain.publishGenesisAccount(genesisCreationContext);
        }).rejects.toThrow(CarmentisError);
    });
     */


    /*
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

     */
});
