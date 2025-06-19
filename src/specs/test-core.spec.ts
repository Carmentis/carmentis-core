import {describe, expect, test} from '@jest/globals';
import {MLDSA44PrivateSignatureKey} from "../common/crypto/signature-interface";
import {KeyedProvider} from "../common/providers/keyed-provider";
import {MemoryProvider} from "../common/providers/memoryProvider";
import {ServerNetworkProvider} from "../common/providers/serverNetworkProvider";
import {Blockchain} from "../common/blockchain/blockchain";


describe('sum module', () => {
    test('adds 1 + 2 to equal 3', () => {
        expect(1 + 2).toBe(3);
    });

    test("testChain()", async () => {
        const privateKey = MLDSA44PrivateSignatureKey.gen();
        const memoryProvider = new MemoryProvider();
        const provider = new KeyedProvider(privateKey, memoryProvider, new ServerNetworkProvider("http://localhost:3000"));
        const blockchain = new Blockchain(provider);
        let hash;

        // account
        console.log("creating genesis account");

        let genesisAccount = await blockchain.createGenesisAccount();

        hash = await genesisAccount.publishUpdates();

        console.log("processing transfer");

        genesisAccount = await blockchain.loadAccount(hash);

        await genesisAccount.transfer({
            account: new Uint8Array(32),
            amount: 1,
            publicReference: "transfer #1",
            privateReference: "private ref."
        });

        await genesisAccount.publishUpdates();

        genesisAccount = await blockchain.loadAccount(hash);

        await genesisAccount.transfer({
            account: new Uint8Array(32),
            amount: 2,
            publicReference: "transfer #2",
            privateReference: "private ref."
        });

        await genesisAccount.publishUpdates();

        genesisAccount = await blockchain.loadAccount(hash);

        // organization
        let organization = await blockchain.createOrganization();

        await organization.setDescription({
            name: "Carmentis SAS",
            city: "Paris",
            countryCode: "FR",
            website: "www.carmentis.io"
        });

        hash = await organization.publishUpdates();

        organization = await blockchain.loadOrganization(hash);

        memoryProvider.clear();
        console.log(await organization.getDescription());
        console.log(await organization.getDescription());
    })
});