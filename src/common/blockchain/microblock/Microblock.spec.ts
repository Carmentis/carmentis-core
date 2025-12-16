import {Microblock} from './Microblock';
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Hash} from "../../entities/Hash";
import {Utils} from "../../utils/utils";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";

import {Secp256k1PrivateSignatureKey} from "../../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";

describe('Microblock.createGenesisAccountMicroblock', () => {
    it('should create a genesis microblock of type ACCOUNT_VIRTUAL_BLOCKCHAIN', () => {
        const microblock = Microblock.createGenesisAccountMicroblock();

        expect(microblock).toBeInstanceOf(Microblock);
        expect(microblock.getType()).toBe(VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN);
    });

    it('should initialize the microblock with default values', () => {
        const microblock = Microblock.createGenesisAccountMicroblock();

        expect(microblock.getHeight()).toBe(1);
        expect(microblock.getTimestamp()).toBeGreaterThan(0);
        expect(microblock.getGasPrice().getAmountAsAtomic()).toBe(0);
        expect(microblock.getGas().getAmountAsAtomic()).toBe(0);
        expect(microblock.getNumberOfSections()).toBe(0);
        expect(microblock.isFeesPayerAccountDefined()).toBe(false);
    });

    it('should have a valid previous hash for a genesis microblock', () => {
        const microblock = Microblock.createGenesisAccountMicroblock();
        const previousHash = microblock.getPreviousHash();

        expect(previousHash).toBeDefined();
        expect(previousHash).toBeInstanceOf(Hash);
    });
});

describe('Microblock.serialize', () => {
    /**
     * Ensures that the serialize method outputs correct structure.
     */
    it('should return an object with the expected properties', () => {
        const type = VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN;
        const microblock = new Microblock(type);

        const serializedData = microblock.serialize();

        expect(serializedData).toHaveProperty('microblockHash');
        expect(serializedData).toHaveProperty('headerData');
        expect(serializedData).toHaveProperty('bodyHash');
        expect(serializedData).toHaveProperty('bodyData');

        expect(serializedData.headerData).toBeInstanceOf(Uint8Array);
        expect(serializedData.bodyData).toBeInstanceOf(Uint8Array);
        expect(serializedData.microblockHash).toBeInstanceOf(Uint8Array);
        expect(serializedData.bodyHash).toBeInstanceOf(Uint8Array);
    });

    /**
     * Verifies serialize output after adding sections.
     */
    it('should correctly serialize a microblock after adding sections', () => {
        const type = VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN;
        const microblock = new Microblock(type);

        microblock.addSection({
            type: SectionType.ACCOUNT_CREATION,
            amount: 0,
            sellerAccount: Utils.getNullHash()
        })

        const serializedData = microblock.serialize();

        // Validate bodyData length reflects the added section
        expect(serializedData.bodyData).not.toHaveLength(0);

        // Validate bodyHash matches computed hash (requires mocking/stubbing hash computation)
        const sha256= CryptoSchemeFactory.createDefaultCryptographicHash();
        const expectedBodyHash = sha256.hash(serializedData.bodyData);
        expect(serializedData.bodyHash).toStrictEqual(expectedBodyHash);
    });
});

describe('Microblock.loadSerializedMicroblock', () => {
    it("should correctly parse a serialized microblock", () => {
        const types = [
            VirtualBlockchainType.APP_LEDGER_VIRTUAL_BLOCKCHAIN,
            VirtualBlockchainType.APPLICATION_VIRTUAL_BLOCKCHAIN,
            VirtualBlockchainType.NODE_VIRTUAL_BLOCKCHAIN,
            VirtualBlockchainType.ORGANIZATION_VIRTUAL_BLOCKCHAIN,
            VirtualBlockchainType.PROTOCOL_VIRTUAL_BLOCKCHAIN,
            VirtualBlockchainType.ACCOUNT_VIRTUAL_BLOCKCHAIN
        ]
        for (const type of types) {
            const microblock = new Microblock(type);
            const serializedData = microblock.serialize();
            expect(serializedData.bodyData).toBeInstanceOf(Uint8Array)
            const recoveredMicroblock = Microblock.loadFromSerializedHeaderAndBody(
                serializedData.headerData,
                serializedData.bodyData
            );
            expect(recoveredMicroblock.getHeight()).toEqual(microblock.getHeight())
            expect(recoveredMicroblock.getNumberOfSections()).toEqual(microblock.getNumberOfSections())
            expect(microblock.getHash()).toBeInstanceOf(Hash)
            expect(microblock.getHash()).toBeInstanceOf(Hash)
            expect(microblock.getHashAsBytes()).not.toStrictEqual(Utils.getNullHash())
            expect(recoveredMicroblock.getHashAsBytes()).toStrictEqual(microblock.getHashAsBytes())
            expect(recoveredMicroblock.getType()).toEqual(microblock.getType())
            expect(recoveredMicroblock.getType()).toEqual(type);
        }

    })
})


describe('Microblock.verifySignature', () => {
    it("should verify a valid signature", async () => {
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await pk.getPublicKeyAsBytes(),
            schemeId: pk.getSignatureSchemeId()
        });
        const signature = await mb.sign(sk);
        expect(signature).toBeInstanceOf(Uint8Array)
        mb.addSection({
            type: SectionType.SIGNATURE,
            signature,
            schemeId: sk.getSignatureSchemeId()
        });
        expect(await mb.verifySignature(pk, signature)).toBe(true)
    })

    it("should verify a valid signature for a microblock signed twice", async () => {
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();

        // create the microblock with a single section
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await pk.getPublicKeyAsBytes(),
            schemeId: pk.getSignatureSchemeId(),
        });

        // sign the microblock a first time
        const firstSignature = await mb.sign(sk);
        expect(firstSignature).toBeInstanceOf(Uint8Array)
        mb.addSection({
            type: SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA,
            channelId: 1,
            data: Utils.getNullHash(),
        });
        expect(await mb.verifySignature(pk, firstSignature)).toBe(true)


        // sign the microblock a second time
        const secondSignature = await mb.sign(sk);
        expect(secondSignature).toBeInstanceOf(Uint8Array)
        mb.addSection({
            type: SectionType.SIGNATURE,
            signature: secondSignature,
            schemeId: sk.getSignatureSchemeId()
        });
        expect(await mb.verifySignature(pk, firstSignature)).toBe(false)
        expect(await mb.verifySignature(pk, secondSignature)).toBe(true)
        expect(await mb.verifySignature(pk, secondSignature)).toBe(true)

        // pop the last signature
        expect(mb.getNumberOfSections()).toBe(3)
        mb.popSection();
        expect(mb.getNumberOfSections()).toBe(2)

        // verify the signatures
        expect(await mb.verifySignature(pk, firstSignature)).toBe(true)
        expect(await mb.verifySignature(pk, secondSignature)).toBe(false)
    })

    it("Recovers the fees payer account after deserializing", async () => {
        const mb = Microblock.createGenesisAccountMicroblock();
        const feesPayerAccount = new Uint8Array([1, 2, 3, 4])
        mb.setFeesPayerAccount(feesPayerAccount);
        const {microblockData: serializedMicroblock} = mb.serialize();
        const recoveredMicroblock = Microblock.loadFromSerializedMicroblock(serializedMicroblock);
        expect(recoveredMicroblock.getFeesPayerAccount()).toBeInstanceOf(Uint8Array)
        expect(recoveredMicroblock.getFeesPayerAccount()).toEqual(feesPayerAccount);
    })
})