import { CHAIN, DATA } from "../constants/constants.js";

export const DB_CHAIN                 = 0x00;
export const DB_VB_RADIX              = 0x01;
export const DB_TOKEN_RADIX           = 0x02;
export const DB_VALIDATOR             = 0x03;
export const DB_BLOCK_INFO            = 0x04;
export const DB_BLOCK_CONTENT         = 0x05;
export const DB_MICROBLOCK_INFO       = 0x06;
export const DB_MICROBLOCK_DATA       = 0x07;
export const DB_VB_INFO               = 0x08;
export const DB_ACCOUNT_STATE         = 0x09;
export const DB_ACCOUNT_HISTORY       = 0x0A;
export const DB_ACCOUNT_BY_PUBLIC_KEY = 0x0B;
export const DB_ACCOUNTS              = 0x0C;
export const DB_VALIDATOR_NODES       = 0x0D;
export const DB_ORGANIZATIONS         = 0x0E;
export const DB_APPLICATIONS          = 0x0F;

export const DB = {
  // chain information
  [ DB_CHAIN ] : [
    { name: "height",         type: DATA.TYPE_UINT48 },
    { name: "lastBlockTs",    type: DATA.TYPE_UINT48 },
    { name: "nMicroblock",    type: DATA.TYPE_UINT48 },
    { name: "objectCounters", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT48, size: CHAIN.N_VIRTUAL_BLOCKCHAINS }
  ],

  // validator: Comet address -> Carmentis ID
  [ DB_VALIDATOR ] : [
    { name: "validatorNodeId", type: DATA.TYPE_BIN256 }
  ],

  // block meta information
  // key: block height
  [ DB_BLOCK_INFO ] : [
    { name: "hash",         type: DATA.TYPE_BIN256 },
    { name: "timestamp",    type: DATA.TYPE_UINT48 },
    { name: "proposerNode", type: DATA.TYPE_BIN256 },
    { name: "size",         type: DATA.TYPE_UINT48 },
    { name: "nMicroblock",  type: DATA.TYPE_UINT48 }
  ],

  // block content
  // key: block height
  [ DB_BLOCK_CONTENT ] : [
    {
      name: "microblocks",
      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
      schema: [
        { name: "hash",     type: DATA.TYPE_BIN256 },
        { name: "vbHash",   type: DATA.TYPE_BIN256 },
        { name: "vbType",   type: DATA.TYPE_UINT8 },
        { name: "height",   type: DATA.TYPE_UINT48 },
        { name: "size",     type: DATA.TYPE_UINT48 },
        { name: "nSection", type: DATA.TYPE_UINT48 }
      ]
    }
  ],

  // microblock information
  // key: microblock hash
  [ DB_MICROBLOCK_INFO ] : [
    { name: "vbHash",       type: DATA.TYPE_BIN256 },
    { name: "vbType",       type: DATA.TYPE_UINT8 },
    { name: "previousHash", type: DATA.TYPE_BIN256 }
  ],

  // microblock data, only used by a client for its local cache
  // vbHash and vbType are the only information that cannot be extracted from the content
  // key: microblock hash
  [ DB_MICROBLOCK_DATA ] : [
    { name: "vbHash",  type: DATA.TYPE_BIN256 },
    { name: "vbType",  type: DATA.TYPE_UINT8 },
    { name: "content", type: DATA.TYPE_BINARY }
  ],

  // virtual blockchain meta information
  // key: VB hash
  [ DB_VB_INFO ] : [
    { name: "height",             type: DATA.TYPE_UINT48 },
    { name: "type",               type: DATA.TYPE_UINT8 },
    { name: "lastMicroblockHash", type: DATA.TYPE_BIN256 },
    { name: "state",              type: DATA.TYPE_BINARY }
  ],

  // current state of an account
  // the hash of this record is stored in the account radix tree
  // key: accountHash
  [ DB_ACCOUNT_STATE ] : [
    { name: "height",          type: DATA.TYPE_UINT48 },
    { name: "balance",         type: DATA.TYPE_UINT48 },
    { name: "lastHistoryHash", type: DATA.TYPE_BIN256 }
  ],

  // each transaction that occurred on an account
  // key: HASH(accountHash + entryHash)
  [ DB_ACCOUNT_HISTORY ] : [
    { name: "height",              type: DATA.TYPE_UINT48 },
    { name: "previousHistoryHash", type: DATA.TYPE_BIN256 },
    { name: "type",                type: DATA.TYPE_UINT8 },
    { name: "timestamp",           type: DATA.TYPE_UINT48 },
    { name: "linkedAccount",       type: DATA.TYPE_BIN256 },
    { name: "amount",              type: DATA.TYPE_UINT48 },
    { name: "chainReference",      type: DATA.TYPE_BINARY }
  ],

  // account public key -> account VB hash
  // key: public key hash
  [ DB_ACCOUNT_BY_PUBLIC_KEY ] : [
    { name: "accountHash", type: DATA.TYPE_BIN256 }
  ],

  // tables used as indexes
  [ DB_ACCOUNTS        ]: [],
  [ DB_VALIDATOR_NODES ]: [],
  [ DB_ORGANIZATIONS   ]: [],
  [ DB_APPLICATIONS    ]: []
};
