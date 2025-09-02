import {Account} from "../blockchain/Account";
import {PublicSignatureKey} from "../crypto/signature/signature-interface";

export class AccountWrapper {
    static async wrap(account: Account) {
        const publicKey = await account.getPublicKey();
        return new AccountWrapper(account, publicKey);
    }

    private constructor(
        private readonly account: Account,
        private readonly publicKey: PublicSignatureKey,
    ) {}

    getId() {
        return this.account.getVirtualBlockchainId();
    }

    getPublicKey() : PublicSignatureKey {
        return this.publicKey
    }

    async isIssuer(): Promise<boolean> {
        return await this.account.isIssuer();
    }
}