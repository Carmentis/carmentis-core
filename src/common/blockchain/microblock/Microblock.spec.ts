import {Microblock} from './Microblock';
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Hash} from "../../entities/Hash";
import {Utils} from "../../utils/utils";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";

import {Secp256k1PrivateSignatureKey} from "../../crypto/signature/secp256k1/Secp256k1PrivateSignatureKey";
import {SectionType} from "../../type/valibot/blockchain/section/SectionType";
import {CMTSToken} from "../../economics/currencies/token";
import {Section} from "../../type/valibot/blockchain/section/sections";
import {BlockchainUtils} from "../../utils/BlockchainUtils";

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
        mb.setGas(CMTSToken.createAtomic(19))
        await mb.seal(sk, { includeGas: false });
        expect(await mb.verify(pk, false)).toBe(true)
        expect(mb.getNumberOfSections()).toBe(2)


        // sign twice
        mb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await pk.getPublicKeyAsBytes(),
            schemeId: pk.getSignatureSchemeId(),
        });
        await mb.seal(sk);
        expect(await mb.verify(pk)).toBe(true)
        expect(mb.getNumberOfSections()).toBe(4)

        // pop the two last sections
        mb.popSection()
        mb.popSection()

        // verify the first signature
        expect(await mb.verify(pk, false)).toBe(true)
        expect(await mb.verify(pk, false)).toBe(true)
        expect(await mb.verify(pk, true)).toBe(false)


    })

    it('Should obtain the same body hash if we compute the signature', async () => {
        const sk = Secp256k1PrivateSignatureKey.gen();
        const pk = await sk.getPublicKey();

        // create the microblock with a single section
        const mb = Microblock.createGenesisAccountMicroblock();
        mb.addSection({
            type: SectionType.ACCOUNT_PUBLIC_KEY,
            publicKey: await pk.getPublicKeyAsBytes(),
            schemeId: pk.getSignatureSchemeId(),
        });
        mb.setGas(CMTSToken.createAtomic(19))
        await mb.seal(sk, { includeGas: false })

        // the body hash must be the same with or without the signature
        const bodyHashWithSignature = mb.computeBodyHash();
        const poppedSection = mb.popSection();
        const bodyHashWithoutSignature = mb.computeBodyHash();
        expect(bodyHashWithSignature).toEqual(bodyHashWithoutSignature)

        // however, a second signature should lead to a distinct body hash (the body hash should include the first signature)
        mb.addSection(poppedSection);
        expect(mb.computeBodyHash()).toEqual(bodyHashWithSignature)
        await mb.seal(sk, { includeGas: false });
        expect(await mb.verify(pk, false)).toBe(true);
        const bodyHashWithoutSecondSignature = mb.computeBodyHash();
        expect(bodyHashWithoutSecondSignature).not.toEqual(bodyHashWithoutSignature)

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

    it("Should compute the correct hash", async () => {
        const sk = Secp256k1PrivateSignatureKey.gen();
        const mb = Microblock.createGenesisOrganizationMicroblock();
        mb.addSections([
            {
                type: SectionType.ORG_CREATION,
                accountId: Uint8Array.from([
                    48, 127,  44, 100, 153, 236,  37,  26,
                    230, 205, 247, 252, 190,  16, 107, 133,
                    98, 121,  25, 188, 217, 148,  59, 167,
                    179,  24,  19, 251, 228, 150,  15,  79
                ]),
            },
            {
                type: SectionType.ORG_DESCRIPTION,
                name: 'Carmentis SAS',
                website: '',
                countryCode: 'FR',
                city: '',
            },
        ]);
        mb.setPreviousHash(Hash.from(Utils.binaryFromHexa('03000000000000001a749bfbaa2c59a93dda75dd3043108dc6a1a25e3c3d27b7')))
        mb.setTimestamp(1767106522)
        //await mb.seal(sk);
        const { microblockData, microblockHash, bodyData, bodyHash } =
            mb.serialize();
        console.log(mb.toString())
        expect(Utils.binaryToHexa(bodyHash))
            .toEqual("1faee202e3c65c1c5092160c80b3f8e1e25d45f20816a9c9ff2c7658925b98a8".toUpperCase())
        expect(bodyHash).toEqual(mb.computeBodyHash());

    })

    it('should convert Uint8Array from browser JSON representation to hexadecimal', () => {
        const uint8ArrayData = new Uint8Array([
            33, 122, 19, 49, 191, 8, 65, 168,
            135, 14, 113, 219, 211, 58, 170, 19,
            23, 182, 45, 49, 105, 245, 210, 197,
            213, 239, 92, 74, 64, 120, 24, 213
        ]);
        const hexString = Utils.binaryToHexa(uint8ArrayData);
        expect(hexString).toBe('217A1331BF0841A8870E71DBD33AAA1317B62D3169F5D2C5D5EF5C4A407818D5');
    })

    it("Should recover the same encoding whatever the order of the fields", async () => {
        const s1: Section =  {
                type: SectionType.ORG_DESCRIPTION,
                name: 'Carmentis SAS',
                website: '',
                countryCode: 'FR',
                city: '',
        };
        const s2: Section =  {
            "type": SectionType.ORG_DESCRIPTION,
            "city": "",
            "website": "",
            "name": "Carmentis SAS",
            "countryCode": "FR",
        };
        expect(BlockchainUtils.encodeSection(s1)).toEqual(BlockchainUtils.encodeSection(s1))
        expect(BlockchainUtils.encodeSection(s1)).toEqual(BlockchainUtils.encodeSection(s2))
    })


})