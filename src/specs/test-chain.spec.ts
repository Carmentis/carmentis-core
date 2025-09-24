import {describe, expect, test} from '@jest/globals';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {Hash} from "../common/entities/Hash";
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
    OrganizationPublicationExecutionContext
} from "../common/providers/publicationContexts/OrganizationPublicationExecutionContext";
import {
    ValidatorNodePublicationExecutionContext
} from "../common/providers/publicationContexts/ValidatorNodePublicationExecutionContext";
import {
    ValidatorNodeNetworkIntegrationPublicationExecutionContext
} from "../common/providers/publicationContexts/ValidatorNodeNetworkIntegrationPublicationExecutionContext";
import {
    ApplicationPublicationExecutionContext
} from "../common/providers/publicationContexts/ApplicationPublicationExecutionContext";
import {
    RecordPublicationExecutionContext
} from "../common/providers/publicationContexts/RecordPublicationExecutionContext";
import {
    AccountNotFoundForAccountHashError, ApplicationLedgerNotFoundError, ApplicationNotFoundError,
    CarmentisError, EmptyBlockError,
    OrganizationNotFoundError
} from "../common/errors/carmentis-error";
import {RecordDescription} from "../common/blockchain/RecordDescription";

const NODE_URL = "http://localhost:26657";

describe('Chain test', () => {
    const TEST_TIMEOUT = 45000;

    // init the content
    const nodeUrl = "http://localhost:26657";
    const issuerPrivateKey = MLDSA65PrivateSignatureKey.gen();
    const blockchain = BlockchainFacade.createFromNodeUrlAndPrivateKey(nodeUrl, issuerPrivateKey);

    it("Works correctly when valid usage of BlockchainFacade", async () => {
        // Testing account
        console.log("creating genesis account");
        // create the genesis account
        const genesisCreationContext = new PublicationExecutionContext();
        const genesisAccountId = await blockchain.publishGenesisAccount(genesisCreationContext);
        const genesisAccount = await blockchain.loadAccount(genesisAccountId);
        expect(genesisAccount).toBeDefined();
        expect(await genesisAccount.isIssuer()).toBeTruthy();
        console.log("Genesis account created with id ", genesisAccountId.encode());

        {
            // create a first account
            const firstAccountPrivateKey = MLDSA65PrivateSignatureKey.gen();
            const firstAccountCreationContext = new AccountPublicationExecutionContext()
                .withBuyerPublicKey(firstAccountPrivateKey.getPublicKey())
                .withSellerAccount(genesisAccountId)
                .withInitialBuyerAccountAmount(CMTSToken.createCMTS(2));
            const firstAccountId = await blockchain.publishAccount(firstAccountCreationContext);
            const firstAccount = await blockchain.loadAccount(firstAccountId);
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
//          expect(firstAccountBalance.equals(secondAccountBalance)).toBeTruthy()
//          expect(firstAccountBalance.getAmountAsCMTS()).toEqual(CMTSToken.oneCMTS().getAmountAsCMTS());
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
//              expect(firstTransactionAmount.equals(CMTSToken.zero())).toBeTruthy()
//              expect(secondTransactionAmount.equals(CMTSToken.oneCMTS())).toBeTruthy()
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
//              expect(firstTransactionAmount.equals(CMTSToken.createCMTS(2))).toBeTruthy()
//              expect(secondTransactionAmount.equals(CMTSToken.createCMTS(-1))).toBeTruthy()
                expect(secondTransactionAmount.isPositive()).toBeFalsy()
                expect(thirdTransaction.isPaidFees()).toBeTruthy();
            }
        }

        {
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

            // Testing validator node
            const CometPublicKeyType = "tendermint/PubKeyEd25519";
            const CometPublicKey = "a5XTiHqlMwWLDpiBCcSk019gEPx9HAuICx0eouEVpaE=";
            const RpcEndpoint = "http://localhost:26667";

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
            expect(reloadedValidatorNode.getVotingPower()).toEqual(10);
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
                .withExpirationIn(365)
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
*/
        }

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

            // Testing first block content
            await expect(async () => await blockchain.getBlockContent(4))
                .rejects
                .toThrow(EmptyBlockError);

            // Testing access chain information
            const chainInformation = await blockchain.getChainInformation();
            expect(chainInformation).toBeDefined();
            expect(chainInformation.getHeight()).toBeGreaterThanOrEqual(1);
            expect(chainInformation.getLatestPublicationTime().getTime()).toBeLessThan(new Date().getTime());
        }
    }, TEST_TIMEOUT)

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

        // search for unknown organization
        await expect(async () => await blockchain.loadOrganization(unknownAccountHash))
            .rejects
            .toThrow(OrganizationNotFoundError)

        // search for unkown application
        await expect(async () => await blockchain.loadApplication(unknownAccountHash))
            .rejects
            .toThrow(ApplicationNotFoundError)

        // search for unknown application ledger
        await expect(async () => await blockchain.loadApplicationLedger(unknownAccountHash))
            .rejects
            .toThrow(ApplicationLedgerNotFoundError)

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
