import {AccountTransactionInterface} from "../blockchain/types";
import {CMTSToken} from "../economics/currencies/token";
import {IllegalParameterError} from "../errors/carmentis-error";
import {Hash} from "./Hash";
import {Transaction} from "./Transaction";
import {Height} from "./Height";

export class AccountHistoryView {
    private transactionByHeight: Map<number, AccountTransactionInterface>;

    constructor() {
        this.transactionByHeight = new Map();
    }

    setTransactionAtHeight(height: number, transaction: AccountTransactionInterface) {
        this.transactionByHeight.set(height, transaction);
    }

    /**
     * Determines whether there are any transactions available.
     *
     * @return {boolean} Returns true if transactions are present, otherwise false.
     */
    containsTransactions(): boolean {
        return this.transactionByHeight.size > 0;
    }

    /**
     * Retrieves the heights of all transactions currently stored.
     *
     * @return {number[]} An array of transaction heights, derived from the keys of the transaction mapping.
     */
    getTransactionHeights(): number[] {
        return Array.from(this.transactionByHeight.keys());
    }

    /**
     * Retrieves the total number of transactions.
     *
     * @return {number} The count of transactions.
     */
    getNumberOfTransactions(): number { return this.transactionByHeight.size }

    /**
     * Checks if there is a transaction at the specified block height.
     *
     * @param {number} height - The block height to check for a transaction.
     * @return {boolean} True if a transaction exists at the specified height, false otherwise.
     */
    containsTransactionAtHeight(height: number): boolean { return this.transactionByHeight.has(height) }

    /*
    getAmountOfTransactionAtHeight(height: number): CMTSToken {
        const transaction = this.getTransactionAtHeight(height);
        return CMTSToken.createAtomic(transaction.amount);
    }

    getDateOfTransactionAtHeight(height: number): Date {
        const transaction = this.getTransactionAtHeight(height);
        return new Date(transaction.timestamp * 1000);
    }

    getTransactionTimestampAtHeight(height: number) : number {
        const transaction = this.getTransactionAtHeight(height);
        return transaction.timestamp;
    }

    getLinkedAccountOfTransactionAtHeight(height: number): Hash {
        const transaction = this.getTransactionAtHeight(height);
        return Hash.from(transaction.linkedAccount);
    }

    getPreviousHashOfTransactionAtHeight(height: number): Hash {
        const transaction = this.getTransactionAtHeight(height);
        return Hash.from(transaction.previousHistoryHash);
    }

     */

    getTransactionAtHeight(height: Height): Transaction {
        const transaction = this.transactionByHeight.get(height);
        if (transaction === undefined) {
            throw new IllegalParameterError(`No transaction found at height ${height}`);
        }
        return new Transaction(transaction);
    }



}