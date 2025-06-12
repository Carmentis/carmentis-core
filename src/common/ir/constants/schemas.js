import * as CHAIN from "./chain.js";
import * as DATA from "./data.js";

// ============================================================================================================================ //
//  Virtual blockchain state                                                                                                    //
// ============================================================================================================================ //
export const VIRTUAL_BLOCKCHAIN_STATE = [
  { name: "type",               type: DATA.TYPE_UINT8 },
  { name: "height",             type: DATA.TYPE_UINT48 },
  { name: "lastMicroblockHash", type: DATA.TYPE_BIN256 },
  { name: "customState",        type: DATA.TYPE_BINARY }
];

// ============================================================================================================================ //
//  Account state                                                                                                               //
// ============================================================================================================================ //
export const ACCOUNT_STATE = [
  { name: "publicKeyHeight", type: DATA.TYPE_UINT48 }
];

// ============================================================================================================================ //
//  Validator node state                                                                                                        //
// ============================================================================================================================ //
export const VALIDATOR_NODE_STATE = [
];

// ============================================================================================================================ //
//  Organization state                                                                                                          //
// ============================================================================================================================ //
export const ORGANIZATION_STATE = [
  { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
  { name: "publicKeyHeight",      type: DATA.TYPE_UINT48 }
];

// ============================================================================================================================ //
//  Application state                                                                                                           //
// ============================================================================================================================ //
export const APPLICATION_STATE = [
];

// ============================================================================================================================ //
//  Application ledger state                                                                                                    //
// ============================================================================================================================ //
export const APP_LEDGER_STATE = [
];

// ============================================================================================================================ //
//  All state schemas                                                                                                           //
// ============================================================================================================================ //
export const STATES = {
  [ CHAIN.VB_ACCOUNT        ]: ACCOUNT_STATE,
  [ CHAIN.VB_VALIDATOR_NODE ]: VALIDATOR_NODE_STATE,
  [ CHAIN.VB_ORGANIZATION   ]: ORGANIZATION_STATE,
  [ CHAIN.VB_APPLICATION    ]: APPLICATION_STATE,
  [ CHAIN.VB_APP_LEDGER     ]: APP_LEDGER_STATE
};

// ============================================================================================================================ //
//  Microblock information                                                                                                      //
// ============================================================================================================================ //
export const MICROBLOCK_INFORMATION = [
  { name: "virtualBlockchainType", type: DATA.TYPE_UINT8 },
  { name: "virtualBlockchainId",   type: DATA.TYPE_BIN256 },
  { name: "previousHash",          type: DATA.TYPE_BIN256 }
];

// ============================================================================================================================ //
//  Microblock content                                                                                                          //
// ============================================================================================================================ //
export const MICROBLOCK_HEADER = [
  { name: "magicString",     type: DATA.TYPE_STRING, size: 4 },
  { name: "protocolVersion", type: DATA.TYPE_UINT16 },
  { name: "height",          type: DATA.TYPE_UINT48 },
  { name: "previousHash",    type: DATA.TYPE_BIN256 },
  { name: "timestamp",       type: DATA.TYPE_UINT48 },
  { name: "gas",             type: DATA.TYPE_UINT24 },
  { name: "gasPrice",        type: DATA.TYPE_UINT32 },
  { name: "bodyHash",        type: DATA.TYPE_BIN256 }
];

export const MICROBLOCK_SECTION = [
  { name: "type", type: DATA.TYPE_UINT8 },
  { name: "data", type: DATA.TYPE_BINARY }
];

export const MICROBLOCK_BODY = [
  { name: "body", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: MICROBLOCK_SECTION }
];
