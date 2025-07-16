import {AccountTransactionInterface} from "../blockchain/types";
import {CMTSToken} from "../economics/currencies/token";
import {IllegalParameterError} from "../errors/carmentis-error";
import {Hash} from "./Hash";

export class AccountHistoryView {
    private transactionByHeight: Map<number, AccountTransactionInterface>;

    constructor() {
        this.transactionByHeight = new Map();
    }

    setTransactionAtHeight(height: number, transaction: AccountTransactionInterface) {
        this.transactionByHeight.set(height, transaction);
    }

    getTransactionHeights(): number[] {
        return Array.from(this.transactionByHeight.keys());
    }

    getNumberOfTransactions(): number { return this.transactionByHeight.size }
    containsTransactionAtHeight(height: number): boolean { return this.transactionByHeight.has(height) }

    getAmountOfTransactionAtHeight(height: number): CMTSToken {
        const transaction = this.getTransactionAtHeight(height);
        return CMTSToken.createAtomic(transaction.amount);
    }

    getDateOfTransactionAtHeight(height: number): Date {
        const transaction = this.getTransactionAtHeight(height);
        return new Date(transaction.timestamp * 1000);
    }

    getLinkedAccountOfTransactionAtHeight(height: number): Hash {
        const transaction = this.getTransactionAtHeight(height);
        return Hash.from(transaction.linkedAccount);
    }

    getPreviousHashOfTransactionAtHeight(height: number): Hash {
        const transaction = this.getTransactionAtHeight(height);
        return Hash.from(transaction.previousHistoryHash);
    }

    /**
     * Retrieves a transaction at the specified height from the account's transaction history.
     *
     * @param {number*/
    private getTransactionAtHeight(height: number) {
        const transaction = this.transactionByHeight.get(height);
        if (transaction === undefined) throw new IllegalParameterError("No transaction found at height " + height + " in account history view.");
        return transaction;
    }

}