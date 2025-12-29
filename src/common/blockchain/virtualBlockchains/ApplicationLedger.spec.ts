import {configure, getConsoleSink} from "@logtape/logtape";


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