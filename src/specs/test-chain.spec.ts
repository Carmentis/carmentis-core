import {describe, expect, test} from '@jest/globals';
import {Provider} from "../common/providers/provider";
import {KeyedProvider} from "../common/providers/keyed-provider";
import {MemoryProvider} from "../common/providers/memoryProvider";
import {ServerNetworkProvider} from "../common/providers/serverNetworkProvider";
import {Blockchain} from "../common/blockchain/blockchain";
import {IntermediateRepresentation} from "../common/records/intermediateRepresentation";
import {Utils} from "../common/utils/utils";
import {SchemaSerializer, SchemaUnserializer} from "../common/data/schemaSerializer";
import {ReadStream, WriteStream} from "../common/data/byteStreams";
import {RadixTree} from "../common/trees/radixTree";
import {DATA, ECO} from '../common/constants/constants';
import {MLDSA65PrivateSignatureKey} from "../common/crypto/signature/ml-dsa-65";
import {EncoderFactory} from "../common/utils/encoder";
import {Hash} from "../common/blockchain/types";

describe('Chain test', () => {
    const TEST_TIMEOUT = 5000;
    test("testChain()", async () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const memoryProvider = new MemoryProvider();
        const networkProvider = new ServerNetworkProvider("http://localhost:3000");
        const keyedProvider = new KeyedProvider(privateKey, memoryProvider, networkProvider);

        let blockchain = new Blockchain(keyedProvider);

        // account
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
            amount: 1,
            publicReference: "transfer #1",
            privateReference: "private ref."
        });

        genesisAccount.setGasPrice(ECO.TOKEN);
        await genesisAccount.publishUpdates();

        console.log("processing transfer #2");

        genesisAccount = await blockchain.loadAccount(genesisAccountId);

        await genesisAccount.transfer({
            account: testAccountId.toBytes(),
            amount: 2,
            publicReference: "transfer #2",
            privateReference: "private ref."
        });

        genesisAccount.setGasPrice(ECO.TOKEN);
        await genesisAccount.publishUpdates();

        console.log("loading back genesis account");

        genesisAccount = await blockchain.loadAccount(genesisAccountId);

        // organization
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

        // application
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

        const explorerProvider = new Provider(memoryProvider, networkProvider);

        blockchain = new Blockchain(explorerProvider);

        const explorer = blockchain.getExplorer();

        console.log("explorer.getAccountState / genesis", await explorer.getAccountState(genesisAccountId));
        console.log("explorer.getAccountState / test", await explorer.getAccountState(testAccountId));

        try {
          console.log("explorer.getAccountByPublicKeyHash");
          await explorer.getAccountByPublicKeyHash(Hash.from("0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF"));
        }
        catch(e) {
          console.log(e);
        }

        console.log("explorer.getVirtualBlockchainState", await explorer.getVirtualBlockchainState(genesisAccountId));
    }, TEST_TIMEOUT);

    test('testIr()', async () => {
        let ir, testObject, sectionData;

        testObject =
            {
                someString: "Hello, world!",
                email: "john.doe@gmail.com",
                someObject: {
                    someStringProp: "As we travel the universe 🪐",
                    someNumberArrayProp: [ 123, 456, 78.9 ],
                    someObjectArrayProp: [ { name: "a" }, { name: "b" }, { name: "c" } ],
                    someNullProp: null,
                    someBooleanProp: true
                }
            };

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);

        ir.buildFromJson(testObject);
        ir.setChannel("this.*", 0);
        ir.setChannel("this.someObject.someStringProp, this.someObject.someNullProp", 1);
        ir.setAsMaskableByRegex("this.email", /^(.)(.*?)(@.)(.*?)(\..*)$/, "$1***$3***$5");
        ir.serializeFields();
        ir.populateChannels();

        sectionData = ir.exportToSectionFormat();
        console.log("sectionData", sectionData);

        ir.setAsRedacted("this.someObject.someNumberArrayProp[*]");

        const proof1 = ir.exportToProof();
        console.log("proof 1", JSON.stringify(proof1, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof1));
        ir.setAsMasked("this.email");
        const proof2 = ir.exportToProof();
        console.log("proof 2", JSON.stringify(proof2, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof2));
        ir.setAsRedacted("this.email");
        ir.setAsRedacted("this.someObject.someStringProp");
        const proof3 = ir.exportToProof();
        console.log("proof 3", JSON.stringify(proof3, null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);
        console.log(ir.importFromProof(proof3));

        console.log("exportToJson", JSON.stringify(ir.exportToJson(), null, 2));

        ir = new IntermediateRepresentation;
        ir.addPrivateChannel(0);
        ir.addPrivateChannel(1);

        ir.importFromSectionFormat(sectionData);
        console.log("recovered from sections", JSON.stringify(ir.exportToJson(), null, 2));
    })

    test("testRecord()", async () => {
        const privateKey = MLDSA65PrivateSignatureKey.gen();
        const keyedProvider = new KeyedProvider(privateKey, new MemoryProvider(), new ServerNetworkProvider("http://localhost:3000"));
        const blockchain = new Blockchain(keyedProvider);

        const object = {
            applicationId: "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
            //  virtualBlockchainId: "0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF0123456789ABCDEF",
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
    }, TEST_TIMEOUT)
});
