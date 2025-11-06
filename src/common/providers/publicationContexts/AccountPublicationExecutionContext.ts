import {PublicationExecutionContext} from "./PublicationExecutionContext";
import {Hash} from "../../entities/Hash";
import {CMTSToken} from "../../economics/currencies/token";
import {PublicSignatureKey} from "../../crypto/signature/PublicSignatureKey";

/**
 * Represents the execution context tailored for account publication-related operations.
 * Extends the functionality of PublicationExecutionContext.
 *
 * This class is designed to provide specific mechanisms and configurations
 * required during the account publication execution process.
 *
 * It inherits common behaviors and properties from the PublicationExecutionContext class,
 * while potentially adding additional context or logic specific to account publications.
 *
 * Intended to encapsulate context details, including metadata and operational configurations,
 * that are necessary for managing account-specific publication workflows.
 */
export class AccountPublicationExecutionContext extends PublicationExecutionContext {
    private sellerAccount?: Hash;
    private buyerPublicKey?: PublicSignatureKey;
    private initialBuyerAccountAmount?: CMTSToken;

    getSellerAccount(): Hash  {
        return this.sellerAccount!;
    }

    getBuyerPublicKey(): PublicSignatureKey  {
        return this.buyerPublicKey!;
    }

    getInitialBuyerAccountAmount(): CMTSToken  {
        return this.initialBuyerAccountAmount!;
    }

    withSellerAccount(sellerAccount: Hash): AccountPublicationExecutionContext {
        this.sellerAccount = sellerAccount;
        return this;
    }

    withBuyerPublicKey(buyerPublicKey: PublicSignatureKey): AccountPublicationExecutionContext {
        this.buyerPublicKey = buyerPublicKey;
        return this;
    }

    withInitialBuyerAccountAmount(initialBuyerAccountAmount: CMTSToken): AccountPublicationExecutionContext {
        this.initialBuyerAccountAmount = initialBuyerAccountAmount;
        return this;
    }
}