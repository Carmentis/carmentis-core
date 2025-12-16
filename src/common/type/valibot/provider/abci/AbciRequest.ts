import * as v from 'valibot';
import {uint8array} from "../../primitives";

// ============================================================================================================================ //
//  ABCI AbciRequest Types Enumeration                                                                                             //
// ============================================================================================================================ //
export enum AbciRequestType {
  GET_CHAIN_INFORMATION = 0x01,
  GET_BLOCK_INFORMATION = 0x03,
  GET_BLOCK_CONTENT = 0x05,
  GET_VIRTUAL_BLOCKCHAIN_STATE = 0x07,
  GET_VIRTUAL_BLOCKCHAIN_UPDATE = 0x09,
  GET_MICROBLOCK_INFORMATION = 0x0B,
  AWAIT_MICROBLOCK_ANCHORING = 0x0D,
  GET_MICROBLOCK_BODYS = 0x0F,
  GET_ACCOUNT_STATE = 0x11,
  GET_ACCOUNT_HISTORY = 0x13,
  GET_ACCOUNT_BY_PUBLIC_KEY_HASH = 0x15,
  GET_VALIDATOR_NODE_BY_ADDRESS = 0x17,
  GET_OBJECT_LIST = 0x19,
  GET_GENESIS_SNAPSHOT = 0x1B,
}

// ============================================================================================================================ //
//  ABCI AbciRequest Schemas                                                                                                       //
// ============================================================================================================================ //

// MSG_GET_CHAIN_INFORMATION (0x01)
export const GetChainInformationAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_CHAIN_INFORMATION),
});

// MSG_GET_BLOCK_INFORMATION (0x03)
export const GetBlockInformationAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_BLOCK_INFORMATION),
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

// MSG_GET_BLOCK_CONTENT (0x05)
export const GetBlockContentAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_BLOCK_CONTENT),
  height: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

// MSG_GET_VIRTUAL_BLOCKCHAIN_STATE (0x07)
export const GetVirtualBlockchainStateAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_VIRTUAL_BLOCKCHAIN_STATE),
  hexEncodedVirtualBlockchainId: v.pipe(v.string(), v.length(64, 'Virtual blockchain ID must be 256 bits (64 hex characters)')),
});

// MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE (0x09)
export const GetVirtualBlockchainUpdateAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_VIRTUAL_BLOCKCHAIN_UPDATE),
  hexEncodedVirtualBlockchainId: v.pipe(v.string(), v.length(64, 'Virtual blockchain ID must be 256 bits (64 hex characters)')),
  knownHeight: v.pipe(v.number(), v.integer(), v.minValue(0)),
});

// MSG_GET_MICROBLOCK_INFORMATION (0x0B)
export const GetMicroblockInformationAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_MICROBLOCK_INFORMATION),
  hash: v.pipe(v.string(), v.length(64, 'Hash must be 256 bits (64 hex characters)')),
});

// MSG_AWAIT_MICROBLOCK_ANCHORING (0x0D)
export const AwaitMicroblockAnchoringAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.AWAIT_MICROBLOCK_ANCHORING),
  hash: v.pipe(v.string(), v.length(64, 'Hash must be 256 bits (64 hex characters)')),
});

// MSG_GET_MICROBLOCK_BODYS (0x0F)
export const GetMicroblockBodysAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_MICROBLOCK_BODYS),
  hashes: v.array(v.pipe(v.string(), v.length(64, 'Hash must be 256 bits (64 hex characters)'))),
});

// MSG_GET_ACCOUNT_STATE (0x11)
export const GetAccountStateAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_ACCOUNT_STATE),
  accountHash: v.pipe(v.string(), v.length(64, 'Account hash must be 256 bits (64 hex characters)')),
});

// MSG_GET_ACCOUNT_HISTORY (0x13)
export const GetAccountHistoryAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_ACCOUNT_HISTORY),
  accountHash: v.pipe(v.string(), v.length(64, 'Account hash must be 256 bits (64 hex characters)')),
  lastHistoryHash: v.pipe(v.string(), v.length(64, 'Last history hash must be 256 bits (64 hex characters)')),
  maxRecords: v.pipe(v.number(), v.integer(), v.minValue(1)),
});

// MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH (0x15)
export const GetAccountByPublicKeyHashAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_ACCOUNT_BY_PUBLIC_KEY_HASH),
  publicKeyHash: v.pipe(v.string(), v.length(64, 'Public key hash must be 256 bits (64 hex characters)')),
});

// MSG_GET_VALIDATOR_NODE_BY_ADDRESS (0x17)
export const GetValidatorNodeByAddressAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_VALIDATOR_NODE_BY_ADDRESS),
  address: uint8array(),
});

// MSG_GET_OBJECT_LIST (0x19)
export const GetObjectListAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_OBJECT_LIST),
  type: v.pipe(v.number(), v.integer(), v.minValue(0), v.maxValue(255)),
});

// MSG_GET_GENESIS_SNAPSHOT (0x1B)
export const GetGenesisSnapshotAbciRequestSchema = v.object({
  requestType: v.literal(AbciRequestType.GET_GENESIS_SNAPSHOT),
});

// ============================================================================================================================ //
//  ABCI AbciRequest Variant Schema                                                                                                //
// ============================================================================================================================ //

export const AbciRequestSchema = v.variant('requestType', [
  GetChainInformationAbciRequestSchema,
  GetBlockInformationAbciRequestSchema,
  GetBlockContentAbciRequestSchema,
  GetVirtualBlockchainStateAbciRequestSchema,
  GetVirtualBlockchainUpdateAbciRequestSchema,
  GetMicroblockInformationAbciRequestSchema,
  AwaitMicroblockAnchoringAbciRequestSchema,
  GetMicroblockBodysAbciRequestSchema,
  GetAccountStateAbciRequestSchema,
  GetAccountHistoryAbciRequestSchema,
  GetAccountByPublicKeyHashAbciRequestSchema,
  GetValidatorNodeByAddressAbciRequestSchema,
  GetObjectListAbciRequestSchema,
  GetGenesisSnapshotAbciRequestSchema,
]);

// ============================================================================================================================ //
//  Type Exports                                                                                                               //
// ============================================================================================================================ //

export type AbciRequest = v.InferOutput<typeof AbciRequestSchema>;
export type GetChainInformationAbciRequest = v.InferOutput<typeof GetChainInformationAbciRequestSchema>;
export type GetBlockInformationAbciRequest = v.InferOutput<typeof GetBlockInformationAbciRequestSchema>;
export type GetBlockContentAbciRequest = v.InferOutput<typeof GetBlockContentAbciRequestSchema>;
export type GetVirtualBlockchainStateAbciRequest = v.InferOutput<typeof GetVirtualBlockchainStateAbciRequestSchema>;
export type GetVirtualBlockchainUpdateAbciRequest = v.InferOutput<typeof GetVirtualBlockchainUpdateAbciRequestSchema>;
export type GetMicroblockInformationAbciRequest = v.InferOutput<typeof GetMicroblockInformationAbciRequestSchema>;
export type AwaitMicroblockAnchoringAbciRequest = v.InferOutput<typeof AwaitMicroblockAnchoringAbciRequestSchema>;
export type GetMicroblockBodysAbciRequest = v.InferOutput<typeof GetMicroblockBodysAbciRequestSchema>;
export type GetAccountStateAbciRequest = v.InferOutput<typeof GetAccountStateAbciRequestSchema>;
export type GetAccountHistoryAbciRequest = v.InferOutput<typeof GetAccountHistoryAbciRequestSchema>;
export type GetAccountByPublicKeyHashAbciRequest = v.InferOutput<typeof GetAccountByPublicKeyHashAbciRequestSchema>;
export type GetValidatorNodeByAddressAbciRequest = v.InferOutput<typeof GetValidatorNodeByAddressAbciRequestSchema>;
export type GetObjectListAbciRequest = v.InferOutput<typeof GetObjectListAbciRequestSchema>;
export type GetGenesisSnapshotAbciRequest = v.InferOutput<typeof GetGenesisSnapshotAbciRequestSchema>;
