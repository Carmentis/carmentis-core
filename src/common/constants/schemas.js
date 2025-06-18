import * as CHAIN from "./chain.js";
import * as DATA from "./data.js";

// ============================================================================================================================ //
//  Record description                                                                                                          //
// ============================================================================================================================ //
const RECORD_ACTOR = [
  { name: "name", type: DATA.TYPE_STRING }
];

const RECORD_CHANNEL = [
  { name: "name",   type: DATA.TYPE_STRING },
  { name: "public", type: DATA.TYPE_BOOLEAN }
];

const RECORD_CHANNEL_ASSIGNATION = [
  { name: "fieldPath",   type: DATA.TYPE_STRING },
  { name: "channelName", type: DATA.TYPE_STRING }
];

const RECORD_ACTOR_ASSIGNATION = [
  { name: "actorName",   type: DATA.TYPE_STRING },
  { name: "channelName", type: DATA.TYPE_STRING }
];

const RECORD_MASKED_PART = [
  { name: "position",          type: DATA.TYPE_UINT32 },
  { name: "length",            type: DATA.TYPE_UINT32 },
  { name: "replacementString", type: DATA.TYPE_STRING }
];

const RECORD_MASKABLE_FIELD = [
  { name: "fieldPath",   type: DATA.TYPE_STRING },
  { name: "maskedParts", type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, schema: RECORD_MASKED_PART }
];

const RECORD_HASHABLE_FIELD = [
  { name: "fieldPath", type: DATA.TYPE_STRING }
];

export const RECORD_DESCRIPTION = [
  { name: "virtualBlockchainId", type: DATA.TYPE_STRING, size: 32, optional: true },
  { name: "data",                type: DATA.TYPE_OBJECT, unspecifiedSchema: true },
  { name: "actors",              type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_ACTOR },
  { name: "channels",            type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_CHANNEL },
  { name: "channelAssignations", type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_CHANNEL_ASSIGNATION },
  { name: "actorAssignations",   type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_ACTOR_ASSIGNATION },
  { name: "hashableFields",      type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_HASHABLE_FIELD },
  { name: "maskableFields",      type: DATA.TYPE_OBJECT | DATA.TYPE_ARRAY_OF, optional: true, schema: RECORD_MASKABLE_FIELD },
  { name: "author",              type: DATA.TYPE_STRING },
  { name: "endorser",            type: DATA.TYPE_STRING, optional: true }
];

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
  { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
  { name: "publicKeyHeight",      type: DATA.TYPE_UINT48 }
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
  { name: "publicKeyHeight",      type: DATA.TYPE_UINT48 },
  { name: "descriptionHeight",    type: DATA.TYPE_UINT48 }
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
//  Microblock                                                                                                                  //
// ============================================================================================================================ //
export const MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET = 12;
export const MICROBLOCK_HEADER_BODY_HASH_OFFSET = 57;
export const MICROBLOCK_HEADER_SIZE = 89;

export const MICROBLOCK_HEADER = [
  { name: "magicString",     type: DATA.TYPE_STRING, size: 4 }, // +0
  { name: "protocolVersion", type: DATA.TYPE_UINT16 },          // +4
  { name: "height",          type: DATA.TYPE_UINT48 },          // +6
  { name: "previousHash",    type: DATA.TYPE_BIN256 },          // +12
  { name: "timestamp",       type: DATA.TYPE_UINT48 },          // +44
  { name: "gas",             type: DATA.TYPE_UINT24 },          // +50
  { name: "gasPrice",        type: DATA.TYPE_UINT32 },          // +53
  { name: "bodyHash",        type: DATA.TYPE_BIN256 }           // +57
];

export const MICROBLOCK_SECTION = [
  { name: "type", type: DATA.TYPE_UINT8 },
  { name: "data", type: DATA.TYPE_BINARY }
];

export const MICROBLOCK_BODY = [
  { name: "body", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: MICROBLOCK_SECTION }
];

export const MICROBLOCK_INFORMATION = [
  { name: "virtualBlockchainId",   type: DATA.TYPE_BIN256 },
  { name: "virtualBlockchainType", type: DATA.TYPE_UINT8 },
  { name: "header",                type: DATA.TYPE_BINARY }
];

// ============================================================================================================================ //
//  Node messages                                                                                                               //
// ============================================================================================================================ //
export const MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE  = 0x00;
export const MSG_VIRTUAL_BLOCKCHAIN_UPDATE      = 0x01;
export const MSG_GET_MICROBLOCK_INFORMATION     = 0x02;
export const MSG_MICROBLOCK_INFORMATION         = 0x03;
export const MSG_GET_MICROBLOCK_BODYS           = 0x04;
export const MSG_MICROBLOCK_BODYS               = 0x05;

export const NODE_MESSAGES = {
  [ MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE ] : [
    { name: "virtualBlockchainId", type: DATA.TYPE_BIN256 },
    { name: "knownHeight",         type: DATA.TYPE_UINT48 }
  ],
  [ MSG_VIRTUAL_BLOCKCHAIN_UPDATE ] : [
    { name: "changed",   type: DATA.TYPE_BOOLEAN },
    { name: "stateData", type: DATA.TYPE_BINARY },
    { name: "headers",   type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BINARY }
  ],
  [ MSG_GET_MICROBLOCK_INFORMATION ] : [
    { name: "hash", type: DATA.TYPE_BIN256 }
  ],
  [ MSG_MICROBLOCK_INFORMATION ] : MICROBLOCK_INFORMATION,
  [ MSG_GET_MICROBLOCK_BODYS ] : [
    { name: "hashes", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BIN256 }
  ],
  [ MSG_MICROBLOCK_BODYS ] : [
    {
      name: "list",
      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
      schema: [
        { name: "hash", type: DATA.TYPE_BIN256 },
        { name: "body", type: DATA.TYPE_BINARY }
      ]
    }
  ]
};
