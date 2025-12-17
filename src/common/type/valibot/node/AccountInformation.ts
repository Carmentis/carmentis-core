import * as v from 'valibot';
import {uint8array} from "../primitives";


export const LOCK_TYPE_COUNT = 3;
export enum LockType {
    Escrow = 0,
    Vesting = 1,
    Staking = 2
}

// Escrow schemas
export const EscrowParametersSchema = v.object({
    escrowIdentifier: uint8array(),
    agentPublicKey: v.any()
});
export type EscrowParameters = v.InferOutput<typeof EscrowParametersSchema>;

export const EscrowLockSchema = v.object({
    type: v.literal(LockType.Escrow),
    amount: v.number(),
    parameters: EscrowParametersSchema
});
export type EscrowLock = v.InferOutput<typeof EscrowLockSchema>;

// Vesting schemas
export const VestingParametersSchema = v.object({
    initialAmount: v.number(),
    startTime: v.number(),
    cliffPeriod: v.number(),
    vestingPeriod: v.number()
});
export type VestingParameters = v.InferOutput<typeof VestingParametersSchema>;

export const VestingLockSchema = v.object({
    type: v.literal(LockType.Vesting),
    amount: v.number(),
    parameters: VestingParametersSchema
});
export type VestingLock = v.InferOutput<typeof VestingLockSchema>;

// Staking schemas
export const StakingParametersSchema = v.object({
    nodeIdentifier: uint8array()
});
export type StakingParameters = v.InferOutput<typeof StakingParametersSchema>;

export const StakingLockSchema = v.object({
    type: v.literal(LockType.Staking),
    amount: v.number(),
    parameters: StakingParametersSchema
});
export type StakingLock = v.InferOutput<typeof StakingLockSchema>;

// Lock variant schema
export const LockSchema = v.variant('type', [
    EscrowLockSchema,
    VestingLockSchema,
    StakingLockSchema
]);
export type Lock = v.InferOutput<typeof LockSchema>;

// Account breakdown schema
export const AccountBreakdownSchema = v.object({
    balance: v.number(),
    escrowed: v.number(),
    vested: v.number(),
    releasable: v.number(),
    staked: v.number(),
    stakeable: v.number(),
    locked: v.number(),
    spendable: v.number()
});
export type AccountBreakdown = v.InferOutput<typeof AccountBreakdownSchema>;


export const AccountStateSchema = v.object({
    height: v.number(),
    balance: v.number(),
    lastHistoryHash: uint8array(),
    locks: v.array(LockSchema),
})

export type AccountState = v.InferOutput<typeof AccountStateSchema>;



export const AccountInformationSchema = v.object({
    type: v.number(),
    exists: v.boolean(),
    state: AccountStateSchema
})
export type AccountInformation = v.InferOutput<typeof AccountInformationSchema>;
