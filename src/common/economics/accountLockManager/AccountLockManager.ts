import { Utils } from '../../utils/utils';
import {
  LOCK_TYPE_COUNT,
  LockType,
  EscrowParameters,
  VestingParameters,
  StakingParameters,
  Lock,
  AccountBreakdown
} from './types'

export class AccountLockManager {
    private balance: number;
    private locks: Lock[];

    constructor() {
        this.balance = 0;
        this.locks = [];
    }

    /**
     * Getters and setters for balance and locks.
     */
    setBalance(balance: number) {
        this.balance = balance;
    }

    getBalance() {
        return this.balance;
    }

    setLocks(locks: Lock[]) {
        this.locks = [...locks];
    }

    getLocks() {
        return this.locks;
    }

    /**
     * Returns the staked amount for a given object.
     */
    getStakedAmountOnObject(objectType: number, objectIdentifier: Uint8Array) {
        const entry = this.locks.find((lock) =>
            lock.type == LockType.Staking &&
            lock.parameters.objectType == objectType &&
            Utils.binaryIsEqual(lock.parameters.objectIdentifier, objectIdentifier)
        );

        if(entry === undefined) {
            return 0;
        }
        return entry.amount;
    }

    /**
     * Adds a given amount of spendable tokens.
     */
    addSpendableTokens(amount: number) {
        this.balance += amount;
    }

    /**
     * Adds vested tokens, given an amount, a start time as a timestamp in seconds, a cliff duration in days and a vesting duration in days.
     */
    addVestedTokens(amount: number, startTime: number, cliffDurationDays: number, vestingDurationDays: number) {
        this.balance += amount;

        this.locks.push({
            type: LockType.Vesting,
            amount,
            parameters: {
                initialAmount: amount,
                startTime,
                cliffDurationDays,
                vestingDurationDays
            }
        });
    }

    /**
     * Adds escrowed tokens, given an amount, an escrow identifier and an agent public key.
     */
    addEscrowedTokens(amount: number, escrowIdentifier: Uint8Array, agentPublicKey: any) {
        this.balance += amount;

        this.locks.push({
            type: LockType.Escrow,
            amount,
            parameters: {
                escrowIdentifier,
                agentPublicKey
            }
        });
    }

    /**
     * Releases escrowed tokens by giving the signature of the agent.
     */
    releaseEscrowedTokens(escrowIdentifier: Uint8Array, agentSignature: any) {
        const lockIndex = this.locks.findIndex((lock) =>
            lock.type == LockType.Escrow &&
            Utils.binaryIsEqual(lock.parameters.escrowIdentifier, escrowIdentifier)
        );

        if(lockIndex == -1) {
            throw new Error(`Escrow not found`);
        }

        this.locks.splice(lockIndex, 1);
    }

    /**
     * Stakes a given amount of tokens for a given object identified by a type and an identifier.
     */
    stake(amount: number, objectType: number, objectIdentifier: Uint8Array) {
        const breakdown = this.getBreakdown();

        if(amount > breakdown.stakeable) {
            throw new Error(`Cannot stake more than ${breakdown.stakeable} tokens`);
        }

        this.locks.push({
            type: LockType.Staking,
            amount,
            parameters: {
                objectType,
                objectIdentifier
            }
        });
    }

    /**
     * Unstakes tokens for a given object.
     */
    unstake(objectType: number, objectIdentifier: Uint8Array) {
        const lockIndex = this.locks.findIndex((lock) =>
            lock.type == LockType.Staking &&
            lock.parameters.objectType == objectType &&
            Utils.binaryIsEqual(lock.parameters.objectIdentifier, objectIdentifier)
        );

        if(lockIndex == -1) {
            throw new Error(`Staking not found`);
        }

        this.locks.splice(lockIndex, 1);
    }

    /**
     * Releases all vesting tokens that should be unlocked as of the given time.
     *
     * This applies the full vesting schedule up to `time`, including any tokens
     * that would have been released earlier but could not be (typically because
     * they were temporarily locked by staking or other constraints).
     *
     * Each vesting lock is updated independently, but release is capped by the
     * globally releasable amount for this account at the current time.
     *
     * Returns the total released amount.
     */
    applyLinearVesting(referenceTimestamp: number) {
        const breakdown = this.getBreakdown();
        let releasable = breakdown.releasable;
        let totalReleased = 0;

        const vestingLocks = this.locks.filter((lock) => lock.type == LockType.Vesting);

        for(const lock of vestingLocks) {
            const cliffTimestamp = Utils.addDaysToTimestamp(lock.parameters.startTime, lock.parameters.cliffDurationDays);

            const elapsed = Math.min(
                Utils.timestampDifferenceInDays(cliffTimestamp, referenceTimestamp),
                lock.parameters.vestingDurationDays
            );

            if(elapsed > 0) {
                const alreadyReleased = lock.parameters.initialAmount - lock.amount;
                const maximumRelease = Math.floor(lock.parameters.initialAmount * elapsed / lock.parameters.vestingDurationDays);
                const released = Math.min(maximumRelease - alreadyReleased, releasable);

                lock.amount -= released;
                releasable -= released;
                totalReleased += released;
            }
        }
        return totalReleased;
    }

    /**
     * Returns the breakdown of the account balance.
     */
    getBreakdown(): AccountBreakdown {
        const balance = this.balance;
        const lockedAmounts = Array(LOCK_TYPE_COUNT).fill(0);

        for(const lock of this.locks) {
            lockedAmounts[lock.type] += lock.amount;
        }

        // locked amounts
        const escrowed = lockedAmounts[LockType.Escrow];
        const vested = lockedAmounts[LockType.Vesting];
        const staked = lockedAmounts[LockType.Staking];

        // the amount of stakeable tokens is the balance, minus the amount of already staked tokens, minus
        // the amount of escrowed tokens
        const stakeable = this.balance - staked - escrowed;

        // the amount of releasable tokens by linear vesting is the amount of vested tokens, minus the amount
        // of staked tokens, or 0 if the difference is negative
        const releasable = Math.max(0, vested - staked);

        // the amount of locked tokens is the amount of escrowed tokens (which are always fully locked) plus
        // the amount of either vested or staked tokens, whichever is higher
        const locked = escrowed + Math.max(vested, staked);

        // the amount of spendable tokens is the balance, minus the amount of locked tokens
        const spendable = balance - locked;

        return {
            balance,
            escrowed,
            vested,
            releasable,
            staked,
            stakeable,
            locked,
            spendable
        };
    }
}
