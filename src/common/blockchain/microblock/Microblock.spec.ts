import {Microblock} from './Microblock';
import {VirtualBlockchainType} from "../../type/VirtualBlockchainType";
import {Hash} from "../../entities/Hash";
import {Utils} from "../../utils/utils";
import {CryptoSchemeFactory} from "../../crypto/CryptoSchemeFactory";

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

        microblock.addAccountCreationSection({
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
                type,
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