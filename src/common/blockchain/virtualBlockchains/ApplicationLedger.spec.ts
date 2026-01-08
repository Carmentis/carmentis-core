import {configure, getConsoleSink} from "@logtape/logtape";
import {ProviderFactory} from "../../providers/ProviderFactory";
import {
    WalletRequestBasedApplicationLedgerMicroblockBuilder
} from "./WalletRequestBasedApplicationLedgerMicroblockBuilder";
import {ApplicationLedgerVb} from "./ApplicationLedgerVb";
import {WalletCrypto} from "../../wallet/WalletCrypto";
import {Utils} from "../../utils/utils";


beforeAll(async () => {
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: '@cmts-dev/carmentis-sdk', lowestLevel: 'debug', sinks: ['console']  }
        ]
    })
})


describe('ApplicationLedgerStateUpdateRequest', () => {
    it('should create a microblock', async () => {

        // we enable the draft mode to be able to work with the current microblock
        const walletCrypto = WalletCrypto.generateWallet();
        const provider = ProviderFactory.createInMemoryProviderWithExternalProvider("http://localhost:26657");
        const applicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        const mbBuilder = await WalletRequestBasedApplicationLedgerMicroblockBuilder.createFromVirtualBlockchain(applicationLedger);
        const mb = await mbBuilder.createMicroblockFromStateUpdateRequest(walletCrypto.getDefaultAccountCrypto(), {
            applicationId: Utils.binaryToHexa(Utils.getNullHash()),
            actorAssignations: [],
            actors: [
                { name: 'sender' },
                { name: 'receiver' },
                { name: 'filesign' },
            ],
            approvalMessage: "",
            author: "filesign",
            channelAssignations: [],
            channels: [
                { public: true, name: "main" }
            ],
            endorser: "sender",
            hashableFields: [],
            maskableFields: [],
            data: {}
        })

        for (const actor of ['sender', "receiver", "filesign"]) {
            const isAssumedToBeSubscribed = actor === 'filesign';
            expect(applicationLedger.isActorDefined(actor)).toBe(true);
            expect(applicationLedger.actorIsSubscribed(actor)).toBe(isAssumedToBeSubscribed);
        }


        // we create a new application ledger which simulates what is supposed to do the wallet to verify
        const newApplicationLedger = ApplicationLedgerVb.createApplicationLedgerVirtualBlockchain(provider);
        newApplicationLedger.enableDraftMode();
        await newApplicationLedger.appendMicroBlock(mb);

        for (const actor of ['sender', "receiver", "filesign"]) {
            const isAssumedToBeSubscribed = actor === 'filesign';
            expect(newApplicationLedger.isActorDefined(actor)).toBe(true);
            expect(newApplicationLedger.actorIsSubscribed(actor)).toBe(isAssumedToBeSubscribed);
        }
        /*
        const provider = ProviderFactory.createInMemoryProvider();
        const vb = new ApplicationLedgerVb(provider);
        const mb = Microblock.createGenesisApplicationLedgerMicroblock();
        const builder = new ApplicationLedgerStateUpdateRequestHandler(mb, vb);

        const hostPrivateDecryptionKey = MlKemPrivateDecryptionKey.gen();
        await builder.createMicroblockFromStateUpdateRequest(
            hostPrivateDecryptionKey,
            {
                applicationId: Utils.binaryToHexa(new Uint8Array(32)),
                author: "test",
                data: {}
            }
        )

         */
    })
});