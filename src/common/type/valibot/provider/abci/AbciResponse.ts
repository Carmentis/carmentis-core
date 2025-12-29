import * as v from 'valibot';
import {MicroblockInformationSchema} from "../MicroblockInformationSchema";
import {VirtualBlockchainInfoSchema} from "../VirtualBlockchainInfo";
import {bin256, uint8array} from "../../primitives";
import {MicroblockBodySchema} from "../../blockchain/microblock/MicroblockBody";
import {LockSchema} from "../../node/AccountInformation";

// ============================================================================================================================ //
//  ABCI Response Types Enumeration                                                                                            //
// ============================================================================================================================ //
export enum AbciResponseType {
  ERROR = 0,
  CHAIN_INFORMATION = 2,
  BLOCK_INFORMATION = 4,
  BLOCK_CONTENT = 6,
  VIRTUAL_BLOCKCHAIN_STATE = 8,
  VIRTUAL_BLOCKCHAIN_UPDATE = 10,
  MICROBLOCK_INFORMATION = 12,
  MICROBLOCK_ANCHORING = 14,
  MICROBLOCK_BODYS = 16,
  ACCOUNT_STATE = 18,
  ACCOUNT_HISTORY = 20,
  ACCOUNT_BY_PUBLIC_KEY_HASH = 22,
  VALIDATOR_NODE_BY_ADDRESS = 24,
  OBJECT_LIST = 26,
  GENESIS_SNAPSHOT = 28,
}
// ============================================================================================================================ //
//  ABCI AbciResponse Schemas                                                                                                      //
// ============================================================================================================================ //

// MSG_ERROR (0x00)
export const ErrorAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.ERROR),
  error: v.string(),
});

// MSG_CHAIN_INFORMATION (0x02)
export const ChainInformationAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.CHAIN_INFORMATION),
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
  lastBlockTimestamp: v.pipe(v.number(), v.integer(), v.minValue(0)),
  microblockCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  objectCounts: v.array(v.pipe(v.number(), v.integer(), v.minValue(0))),
});

// MSG_BLOCK_INFORMATION (0x04)
export const BlockInformationAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.BLOCK_INFORMATION),
  hash: bin256(),
  timestamp: v.pipe(v.number(), v.integer(), v.minValue(0)),
  proposerAddress: uint8array(),
  size: v.pipe(v.number(), v.integer(), v.minValue(0)),
  microblockCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

// MSG_BLOCK_CONTENT (0x06)
const MicroblockInBlockSchema = v.object({
  hash: bin256(),
  vbId: bin256(),
  vbType: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
  size: v.pipe(v.number(), v.integer(), v.minValue(0)),
  sectionCount: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

export const BlockContentAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.BLOCK_CONTENT),
  microblocks: v.array(MicroblockInBlockSchema),
});

// MSG_VIRTUAL_BLOCKCHAIN_STATE (0x08)
export const VirtualBlockchainStateAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.VIRTUAL_BLOCKCHAIN_STATE),
  serializedVirtualBlockchainState: uint8array(),
});

// MSG_VIRTUAL_BLOCKCHAIN_UPDATE (0x0A)
export const VirtualBlockchainUpdateAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.VIRTUAL_BLOCKCHAIN_UPDATE),
  exists: v.boolean(),
  changed: v.boolean(),
  serializedVirtualBlockchainState: uint8array(),
  serializedHeaders: v.array(uint8array()),
});

// MSG_MICROBLOCK_INFORMATION (0x0C)
export const MicroblockInformationAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.MICROBLOCK_INFORMATION),
  ...MicroblockInformationSchema.entries
});

// MSG_MICROBLOCK_ANCHORING (0x0E)
export const MicroblockAnchoringAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.MICROBLOCK_ANCHORING),
  ...VirtualBlockchainInfoSchema.entries
});

export const MicroblockBodyItemSchema = v.object({
    microblockHash: bin256(),
    microblockBody: MicroblockBodySchema,
})

export const MicroblockBodysAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.MICROBLOCK_BODYS),
  list: v.array(MicroblockBodyItemSchema),
});

export const AccountStateAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.ACCOUNT_STATE),
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
  balance: v.pipe(v.number(), v.integer(), v.minValue(0)),
    lastHistoryHash: bin256(),
  locks: v.array(LockSchema),
});

// MSG_ACCOUNT_HISTORY (0x14)
export const AccountHistoryItemSchema = v.object({
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
  previousHistoryHash: bin256(),
  type: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
  timestamp: v.pipe(v.number(), v.integer(), v.minValue(0)),
  linkedAccount: bin256(),
  amount: v.pipe(v.number(), v.integer(), v.minValue(0)),
  chainReference: uint8array(),
});

export const AccountHistoryAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.ACCOUNT_HISTORY),
  list: v.array(AccountHistoryItemSchema),
});

// MSG_ACCOUNT_BY_PUBLIC_KEY_HASH (0x16)
export const AccountByPublicKeyHashAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.ACCOUNT_BY_PUBLIC_KEY_HASH),
  accountHash: bin256(),
});

// MSG_VALIDATOR_NODE_BY_ADDRESS (0x18)
export const ValidatorNodeByAddressAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.VALIDATOR_NODE_BY_ADDRESS),
  validatorNodeHash: bin256(),
});

// MSG_OBJECT_LIST (0x1A)
export const ObjectListAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.OBJECT_LIST),
  list: v.array(bin256()),
});

// MSG_GENESIS_SNAPSHOT (0x1C)
export const GenesisSnapshotAbciResponseSchema = v.object({
  responseType: v.literal(AbciResponseType.GENESIS_SNAPSHOT),
  base64EncodedChunks: v.array(v.string()),
});

// ============================================================================================================================ //
//  ABCI AbciResponse Variant Schema                                                                                               //
// ============================================================================================================================ //

export const AbciResponseSchema = v.variant('responseType', [
  ErrorAbciResponseSchema,
  ChainInformationAbciResponseSchema,
  BlockInformationAbciResponseSchema,
  BlockContentAbciResponseSchema,
  VirtualBlockchainStateAbciResponseSchema,
  VirtualBlockchainUpdateAbciResponseSchema,
  MicroblockInformationAbciResponseSchema,
  MicroblockAnchoringAbciResponseSchema,
  MicroblockBodysAbciResponseSchema,
  AccountStateAbciResponseSchema,
  AccountHistoryAbciResponseSchema,
  AccountByPublicKeyHashAbciResponseSchema,
  ValidatorNodeByAddressAbciResponseSchema,
  ObjectListAbciResponseSchema,
  GenesisSnapshotAbciResponseSchema,
]);

// ============================================================================================================================ //
//  Type Exports                                                                                                               //
// ============================================================================================================================ //

export type AbciResponse = v.InferOutput<typeof AbciResponseSchema>;
export type ErrorAbciResponse = v.InferOutput<typeof ErrorAbciResponseSchema>;
export type ChainInformationAbciResponse = v.InferOutput<typeof ChainInformationAbciResponseSchema>;
export type BlockInformationAbciResponse = v.InferOutput<typeof BlockInformationAbciResponseSchema>;
export type BlockContentAbciResponse = v.InferOutput<typeof BlockContentAbciResponseSchema>;
export type VirtualBlockchainStateAbciResponse = v.InferOutput<typeof VirtualBlockchainStateAbciResponseSchema>;
export type VirtualBlockchainUpdateAbciResponse = v.InferOutput<typeof VirtualBlockchainUpdateAbciResponseSchema>;
export type MicroblockInformationAbciResponse = v.InferOutput<typeof MicroblockInformationAbciResponseSchema>;
export type MicroblockAnchoringAbciResponse = v.InferOutput<typeof MicroblockAnchoringAbciResponseSchema>;
export type MicroblockBodysAbciResponse = v.InferOutput<typeof MicroblockBodysAbciResponseSchema>;
export type AccountStateAbciResponse = v.InferOutput<typeof AccountStateAbciResponseSchema>;
export type AccountHistoryAbciResponse = v.InferOutput<typeof AccountHistoryAbciResponseSchema>;
export type AccountByPublicKeyHashAbciResponse = v.InferOutput<typeof AccountByPublicKeyHashAbciResponseSchema>;
export type ValidatorNodeByAddressAbciResponse = v.InferOutput<typeof ValidatorNodeByAddressAbciResponseSchema>;
export type ObjectListAbciResponse = v.InferOutput<typeof ObjectListAbciResponseSchema>;
export type GenesisSnapshotAbciResponse = v.InferOutput<typeof GenesisSnapshotAbciResponseSchema>;
