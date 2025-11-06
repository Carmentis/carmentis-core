import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Hash} from "../../entities/Hash";
import {CMTSToken} from "../../economics/currencies/token";
import {IllegalUsageError} from "../../errors/carmentis-error";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";
import {PrivateSignatureKey} from "../../crypto/signature/PrivateSignatureKey";

export class AccountTransferPublicationExecutionContext extends PublicationExecutionContext {
    private sellerAccountPrivateKey?: PrivateSignatureKey;
    private buyerAccountHash?: Hash;
    private buyerPublicKey?: PublicSignatureKey;
    private amount: CMTSToken;
    private publicReference: string;
    private privateReference: string;

    constructor() {
        super();
        this.amount = CMTSToken.zero();
        this.privateReference = "";
        this.publicReference = "";
    }

    getBuyerAccount(): Hash {
        return this.buyerAccountHash!;
    }

    getAmount(): CMTSToken {
        return this.amount!;
    }

    getPublicReference(): string {
        return this.publicReference!;
    }

    getPrivateReference(): string {
        return this.privateReference!;
    }

    withTransferToAccountHash(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash): AccountTransferPublicationExecutionContext {
        this.sellerAccountPrivateKey = sellerPrivateKey;
        this.buyerAccountHash = buyerAccount;
        return this;
    }

    withTransferToPublicKey(sellerPrivateKey: PrivateSignatureKey, buyerPublicKey: PublicSignatureKey): AccountTransferPublicationExecutionContext {
        this.sellerAccountPrivateKey = sellerPrivateKey;
        this.buyerPublicKey = buyerPublicKey;
        return this;
    }

    withAmount(amount: CMTSToken): AccountTransferPublicationExecutionContext {
        this.amount = amount;
        return this;
    }

    withPublicReference(publicReference: string): AccountTransferPublicationExecutionContext {
        this.publicReference = publicReference;
        return this;
    }

    withPrivateReference(privateReference: string): AccountTransferPublicationExecutionContext {
        this.privateReference = privateReference;
        return this;
    }

    build() {
        if (!this.sellerAccountPrivateKey) throw new IllegalUsageError("Seller account is required");
        const buyerAccount = this.buyerAccountHash || this.buyerPublicKey;
        if (buyerAccount === undefined) throw new IllegalUsageError("Buyer account is required");

        return {
            buyerAccount,
            sellerPrivateKey: this.sellerAccountPrivateKey,
            amount: this.amount,
            publicReference: this.publicReference,
            privateReference: this.privateReference
        };
    }
}