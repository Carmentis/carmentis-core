import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Hash} from "../../entities/Hash";
import {CMTSToken} from "../../economics/currencies/token";
import {IllegalUsageError} from "../../errors/carmentis-error";
import {PrivateSignatureKey} from "../../crypto/signature/signature-interface";

export class AccountTransferPublicationExecutionContext extends PublicationExecutionContext {
    private sellerAccountPrivateKey?: PrivateSignatureKey;
    private buyerAccount?: Hash;
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
        return this.buyerAccount!;
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

    withTransfer(sellerPrivateKey: PrivateSignatureKey, buyerAccount: Hash): AccountTransferPublicationExecutionContext {
        this.sellerAccountPrivateKey = sellerPrivateKey;
        this.buyerAccount = buyerAccount;
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
        if (!this.sellerAccountPrivateKey || !this.buyerAccount) throw new IllegalUsageError("Accounts are required for account transfer publication.");
        return {
            buyerAccount: this.buyerAccount,
            sellerPrivateKey: this.sellerAccountPrivateKey,
            amount: this.amount,
            publicReference: this.publicReference,
            privateReference: this.privateReference
        };
    }
}