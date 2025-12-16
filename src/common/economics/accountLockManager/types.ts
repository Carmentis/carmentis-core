export const LOCK_TYPE_COUNT = 3;

export enum LockType {
    Escrow = 0,
    Vesting = 1,
    NodeStaking = 2,
}

export type EscrowParameters = {
    fundEmitterAccountId: Uint8Array,
    transferAuthorizerAccountId: Uint8Array
};

export type VestingParameters = {
    initialVestedAmountInAtomics: number,
    cliffStartTimestamp: number,
    cliffDurationDays: number,
    vestingDurationDays: number
};

export type NodeStakingParameters = {
    validatorNodeAccountId: Uint8Array
};

export type Lock =
    | { type: LockType.Escrow, lockedAmountInAtomics: number, parameters: EscrowParameters }
    | { type: LockType.Vesting, lockedAmountInAtomics: number, parameters: VestingParameters }
    | { type: LockType.NodeStaking, lockedAmountInAtomics: number, parameters: NodeStakingParameters };

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
