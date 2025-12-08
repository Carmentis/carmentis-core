export const LOCK_TYPE_COUNT = 3;

export enum LockType {
    Escrow = 0,
    Vesting = 1,
    Staking = 2
}

export type EscrowParameters = {
    escrowIdentifier: Uint8Array,
    agentPublicKey: any
};

export type VestingParameters = {
    initialAmount: number,
    startTime: number,
    cliffDurationDays: number,
    vestingDurationDays: number
};

export type StakingParameters = {
    nodeIdentifier: Uint8Array
};

export type Lock =
    | { type: LockType.Escrow, amount: number, parameters: EscrowParameters }
    | { type: LockType.Vesting, amount: number, parameters: VestingParameters }
    | { type: LockType.Staking, amount: number, parameters: StakingParameters };

export type AccountBreakdown = {
    balance: number,
    escrowed: number,
    vested: number,
    releasable: number,
    staked: number,
    stakeable: number,
    locked: number,
    spendable: number
};
