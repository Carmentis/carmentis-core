import {Wallet} from './wallet';
import {randomBytes} from 'crypto';

jest.mock('crypto', () => ({
    randomBytes: jest.fn(),
}));

describe('Wallet.generateWallet', () => {
    it('should generate a wallet with a random 64-byte seed', () => {
        const mockSeed = new Uint8Array(64).fill(42); // Example seed
        (randomBytes as jest.Mock).mockReturnValue(mockSeed);

        const wallet = Wallet.generateWallet();

        expect(randomBytes).toHaveBeenCalledWith(64);
        expect(wallet).toBeInstanceOf(Wallet);
        expect((wallet as any).walletSeed).toEqual(mockSeed); // Accessing private walletSeed for testing
    });
});