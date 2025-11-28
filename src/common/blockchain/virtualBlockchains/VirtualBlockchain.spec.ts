import {AccountVb} from "./AccountVb";
import {ProviderFactory} from "../../providers/ProviderFactory";
import {Microblock} from "../microblock/Microblock";
import {Secp256k1PrivateSignatureKey, Secp256k1PublicSignatureKey} from "../../crypto/signature/secp256k1";
import {Utils} from "../../utils/utils";
import {configure, getConsoleSink} from "@logtape/logtape";


beforeAll(async () => {
    await configure({
        sinks: { console: getConsoleSink() },
        loggers: [
            { category: 'microblock', lowestLevel: 'debug', sinks: ['console']  }
        ]
    })
})

describe("virtualBlockchain.appendMicroblock", () => {
    it('should correctly add a microblock', async () => {
        const provider = ProviderFactory.createInMemoryProvider();
        const accountVb = new AccountVb(provider);
        expect(accountVb.isEmpty()).toBeTruthy();
        expect(accountVb.getHeight()).toEqual(0);

        // create an initial microblock
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const microblock = await AccountVb.createIssuerAccountCreationMicroblock(
            pk
        );
        const signature = await microblock.sign(sk);
        microblock.addAccountSignatureSection({ signature });
        await accountVb.appendMicroBlock(microblock)
        expect(accountVb.getHeight()).toEqual(1)
        expect(accountVb.isEmpty()).toBeFalsy();
        expect(await accountVb.getPublicKey()).toBeInstanceOf(Secp256k1PublicSignatureKey);
        expect(await accountVb.getMicroblock(1)).toBeInstanceOf(Microblock)
    });
})