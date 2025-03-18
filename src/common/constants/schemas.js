import * as DATA from "./data.js";
import * as ID from "./id.js";

// ============================================================================================================================ //
//  Error                                                                                                                       //
// ============================================================================================================================ //
export const ERROR = [
  { name: "type",type: DATA.UINT8 },
  { name: "id",  type: DATA.UINT8 },
  { name: "arg", type: DATA.STRING | DATA.ARRAY }
];

// ============================================================================================================================ //
//  Virtual blockchain states                                                                                                   //
// ============================================================================================================================ //
export const VB_STATES = {
  [ ID.OBJ_ACCOUNT ] : [
    { name: "genesisSeed", type: DATA.HASH },
    { name: "publicKey",   type: DATA.PUB_KEY | DATA.OPTIONAL }
  ],
  [ ID.OBJ_VALIDATOR_NODE ] : [
    { name: "genesisSeed", type: DATA.HASH }
  ],
  [ ID.OBJ_ORGANIZATION ] : [
    { name: "genesisSeed", type: DATA.HASH },
    { name: "publicKey",   type: DATA.PUB_KEY | DATA.OPTIONAL }
  ],
  [ ID.OBJ_APP_USER ] : [
    { name: "genesisSeed", type: DATA.HASH }
  ],
  [ ID.OBJ_APPLICATION ] : [
    { name: "genesisSeed",    type: DATA.HASH },
    { name: "organizationId", type: DATA.HASH }
  ],
  [ ID.OBJ_APP_LEDGER ] : [
    { name: "genesisSeed", type: DATA.HASH },
    { name: "actors", type: DATA.OBJECT | DATA.ARRAY, schema:
      [
        { name: "name",        type: DATA.STRING },
        { name: "type",        type: DATA.UINT8 },
        { name: "invitations", type: DATA.OBJECT | DATA.ARRAY, schema:
          [
            { name: "channelId", type: DATA.UINT16 },
            { name: "height",    type: DATA.UINT48 }
          ]
        },
        { name: "subscribed", type: DATA.UINT8 }
      ]
    },
    { name: "channels", type: DATA.OBJECT | DATA.ARRAY, schema:
      [
        { name: "name",       type: DATA.STRING },
        { name: "keyOwnerId", type: DATA.UINT16 }
      ]
    }
  ],
  [ ID.OBJ_ORACLE ] : [
    { name: "genesisSeed", type: DATA.HASH }
  ]
};

// ============================================================================================================================ //
//  Database tables                                                                                                             //
// ============================================================================================================================ //
export const DB_CHAIN                 = 0x0;
export const DB_BLOCK_INFO            = 0x1;
export const DB_BLOCK_CONTENT         = 0x2;
export const DB_MICROBLOCK_INFO       = 0x3;
export const DB_MICROBLOCK_DATA       = 0x4;
export const DB_VB_INFO               = 0x5;
export const DB_ACCOUNT_STATE         = 0x6;
export const DB_ACCOUNT_HISTORY       = 0x7;
export const DB_ACCOUNT_BY_PUBLIC_KEY = 0x8;
export const DB_ACCOUNTS              = 0x9;
export const DB_VALIDATOR_NODES       = 0xA;
export const DB_ORGANIZATIONS         = 0xB;
export const DB_APPLICATIONS          = 0xC;
export const DB_ORACLES               = 0xD;

export const DB = {
  // chain information
  [ DB_CHAIN ] : [
    { name: "height",         type: DATA.UINT48 },
    { name: "lastBlockTs",    type: DATA.UINT48 },
    { name: "nMicroblock",    type: DATA.UINT48 },
    { name: "nSection",       type: DATA.UINT48 },
    { name: "objectCounters", type: DATA.UINT48 | DATA.ARRAY, size: ID.N_OBJECTS }
  ],

  // block meta information
  // key: block height
  [ DB_BLOCK_INFO ] : [
    { name: "hash",         type: DATA.HASH },
    { name: "timestamp",    type: DATA.UINT48 },
    { name: "proposerNode", type: DATA.HASH },
    { name: "size",         type: DATA.UINT48 },
    { name: "nMicroblock",  type: DATA.UINT48 }
  ],

  // block content
  // key: block height
  [ DB_BLOCK_CONTENT ] : [
    {
      name: "microblocks",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: [
        { name: "hash",     type: DATA.HASH },
        { name: "vbHash",   type: DATA.HASH },
        { name: "vbType",   type: DATA.UINT8 },
        { name: "height",   type: DATA.UINT48 },
        { name: "size",     type: DATA.UINT48 },
        { name: "nSection", type: DATA.UINT48 }
      ]
    }
  ],

  // microblock meta information, only used by a node
  // key: microblock hash
  [ DB_MICROBLOCK_INFO ] : [
    { name: "vbHash",       type: DATA.HASH },
    { name: "vbType",       type: DATA.UINT8 },
    { name: "previousHash", type: DATA.HASH }
  ],

  // microblock data, only used by a client for its local cache
  // vbHash and vbType are the only information that cannot be extracted from the content
  // key: microblock hash
  [ DB_MICROBLOCK_DATA ] : [
    { name: "vbHash",  type: DATA.HASH },
    { name: "vbType",  type: DATA.UINT8 },
    { name: "content", type: DATA.BINARY }
  ],

  // virtual blockchain meta information
  // key: VB hash
  [ DB_VB_INFO ] : [
    { name: "height",             type: DATA.UINT48 },
    { name: "type",               type: DATA.UINT8 },
    { name: "lastMicroblockHash", type: DATA.HASH },
    { name: "state",              type: DATA.BINARY }
  ],

  // current state of an account
  // the hash of this record is stored in the account radix tree
  // key: accountHash
  [ DB_ACCOUNT_STATE ] : [
    { name: "height",          type: DATA.UINT48 },
    { name: "balance",         type: DATA.UINT48 },
    { name: "lastHistoryHash", type: DATA.HASH }
  ],

  // each transaction that occurred on an account
  // key: HASH(accountHash + entryHash)
  [ DB_ACCOUNT_HISTORY ] : [
    { name: "height",              type: DATA.UINT48 },
    { name: "previousHistoryHash", type: DATA.HASH },
    { name: "type",                type: DATA.UINT8 },
    { name: "timestamp",           type: DATA.UINT48 },
    { name: "linkedAccount",       type: DATA.HASH },
    { name: "amount",              type: DATA.UINT48 },
    { name: "chainReference",      type: DATA.BINARY }
  ],

  // account public key -> account VB hash
  // key: public key hash
  [ DB_ACCOUNT_BY_PUBLIC_KEY ] : [
    { name: "accountHash", type: DATA.HASH }
  ],

  // tables used as indexes
  [ DB_ACCOUNTS        ]: [],
  [ DB_VALIDATOR_NODES ]: [],
  [ DB_ORGANIZATIONS   ]: [],
  [ DB_APPLICATIONS    ]: [],
  [ DB_ORACLES         ]: []
};

// ============================================================================================================================ //
//  Account history references (chainReference field in DB_ACCOUNT_HISTORY)                                                     //
// ============================================================================================================================ //
// reference to a microblock section (for token transfers)
export const ACCOUNT_SECTION_REFERENCE = [
  { name: "mbHash",       type: DATA.HASH },
  { name: "sectionIndex", type: DATA.UINT16 }
];

// reference to a microblock (for paid fees)
export const ACCOUNT_MB_REFERENCE = [
  { name: "mbHash", type: DATA.HASH }
];

// reference to a block (for earned fees)
export const ACCOUNT_BLOCK_REFERENCE = [
  { name: "height", type: DATA.UINT48 }
];

// ============================================================================================================================ //
//  Error message                                                                                                               //
// ============================================================================================================================ //
export const MSG_ANS_ERROR = 0xFF;

// ============================================================================================================================ //
//  Node network messages                                                                                                       //
// ============================================================================================================================ //
export const MSG_GET_CHAIN_STATUS          = 0x00;
export const MSG_GET_BLOCK_LIST            = 0x01;
export const MSG_GET_BLOCK_INFO            = 0x02;
export const MSG_GET_BLOCK_CONTENT         = 0x03;
export const MSG_GET_VB_INFO               = 0x04;
export const MSG_GET_VB_CONTENT            = 0x05;
export const MSG_GET_RAW_MICROBLOCK        = 0x06;
export const MSG_GET_RAW_MICROBLOCKS       = 0x07;
export const MSG_GET_NEW_MICROBLOCKS       = 0x08;
export const MSG_GET_ACCOUNT_STATE         = 0x09;
export const MSG_GET_ACCOUNT_HISTORY       = 0x0A;
export const MSG_GET_ACCOUNT_BY_PUBLIC_KEY = 0x0B;
export const MSG_SEND_MICROBLOCK           = 0x0C;
export const MSG_GET_ACCOUNTS              = 0x0D;
export const MSG_GET_VALIDATOR_NODES       = 0x0E;
export const MSG_GET_ORGANIZATIONS         = 0x0F;
export const MSG_GET_APPLICATIONS          = 0x10;
export const MSG_GET_ORACLES               = 0x11;

export const MSG_ANS_OK                    = 0x80;
export const MSG_ANS_HASH                  = 0x81;
export const MSG_ANS_STRING                = 0x82;
export const MSG_ANS_FILE                  = 0x83;
export const MSG_ANS_CHAIN_STATUS          = 0x84;
export const MSG_ANS_BLOCK_LIST            = 0x85;
export const MSG_ANS_BLOCK_INFO            = 0x86;
export const MSG_ANS_BLOCK_CONTENT         = 0x87;
export const MSG_ANS_VB_INFO               = 0x88;
export const MSG_ANS_VB_CONTENT            = 0x89;
export const MSG_ANS_RAW_MICROBLOCK        = 0x8A;
export const MSG_ANS_RAW_MICROBLOCKS       = 0x8B;
export const MSG_ANS_ACCOUNT_STATE         = 0x8C;
export const MSG_ANS_ACCOUNT_HISTORY       = 0x8D;
export const MSG_ANS_ACCOUNT_BY_PUBLIC_KEY = 0x8E;
export const MSG_ANS_ACCEPT_MICROBLOCK     = 0x8F;
export const MSG_ANS_ANCHORING             = 0x90;
export const MSG_ANS_OBJECT_LIST           = 0x91;

export const MSG_NAMES = {
  [ MSG_GET_CHAIN_STATUS          ]: "GET_CHAIN_STATUS",
  [ MSG_GET_BLOCK_LIST            ]: "GET_BLOCK_LIST",
  [ MSG_GET_BLOCK_INFO            ]: "GET_BLOCK_INFO",
  [ MSG_GET_BLOCK_CONTENT         ]: "GET_BLOCK_CONTENT",
  [ MSG_GET_VB_INFO               ]: "GET_VB_INFO",
  [ MSG_GET_VB_CONTENT            ]: "GET_VB_CONTENT",
  [ MSG_GET_RAW_MICROBLOCK        ]: "GET_RAW_MICROBLOCK",
  [ MSG_GET_RAW_MICROBLOCKS       ]: "GET_RAW_MICROBLOCKS",
  [ MSG_GET_NEW_MICROBLOCKS       ]: "GET_NEW_MICROBLOCKS",
  [ MSG_GET_ACCOUNT_STATE         ]: "GET_ACCOUNT_STATE",
  [ MSG_GET_ACCOUNT_HISTORY       ]: "GET_ACCOUNT_HISTORY",
  [ MSG_GET_ACCOUNT_BY_PUBLIC_KEY ]: "GET_ACCOUNT_BY_PUBLIC_KEY",
  [ MSG_SEND_MICROBLOCK           ]: "SEND_MICROBLOCK",
  [ MSG_GET_ACCOUNTS              ]: "GET_ACCOUNTS",
  [ MSG_GET_VALIDATOR_NODES       ]: "GET_VALIDATOR_NODES",
  [ MSG_GET_ORGANIZATIONS         ]: "GET_ORGANIZATIONS",
  [ MSG_GET_APPLICATIONS          ]: "GET_APPLICATIONS",
  [ MSG_GET_ORACLES               ]: "GET_ORACLES"
};

export const NODE_MESSAGES = {
  // -------------------------------------------------------------------------------------------------------------------------- //
  //  retrieving data from a node                                                                                               //
  // -------------------------------------------------------------------------------------------------------------------------- //
  [ MSG_GET_CHAIN_STATUS ] : [
    // no argument
  ],
  [ MSG_GET_BLOCK_LIST ] : [
    { name: "height",    type: DATA.UINT48 },
    { name: "maxBlocks", type: DATA.UINT16 }
  ],
  [ MSG_GET_BLOCK_INFO ] : [
    { name: "height", type: DATA.UINT48 }
  ],
  [ MSG_GET_BLOCK_CONTENT ] : [
    { name: "height", type: DATA.UINT48 }
  ],
  [ MSG_GET_VB_INFO ] : [
    { name: "vbHash", type: DATA.HASH }
  ],
  [ MSG_GET_VB_CONTENT ] : [
    { name: "vbHash", type: DATA.HASH }
  ],
  [ MSG_GET_RAW_MICROBLOCK ] : [
    { name: "mbHash", type: DATA.HASH }
  ],
  [ MSG_GET_RAW_MICROBLOCKS ] : [
    { name: "list", type: DATA.HASH | DATA.ARRAY }
  ],
  [ MSG_GET_NEW_MICROBLOCKS ] : [
    { name: "vbHash",        type: DATA.HASH },
    { name: "lastKnownHash", type: DATA.HASH }
  ],
  [ MSG_GET_ACCOUNT_STATE ] : [
    { name: "accountHash", type: DATA.HASH }
  ],
  [ MSG_GET_ACCOUNT_HISTORY ] : [
    { name: "accountHash",     type: DATA.HASH },
    { name: "lastHistoryHash", type: DATA.HASH },
    { name: "maxRecords",      type: DATA.UINT16 }
  ],
  [ MSG_GET_ACCOUNT_BY_PUBLIC_KEY ] : [
    { name: "publicKey", type: DATA.PUB_KEY }
  ],
  [ MSG_GET_ACCOUNTS ] : [
  ],
  [ MSG_GET_VALIDATOR_NODES ] : [
  ],
  [ MSG_GET_ORGANIZATIONS ] : [
  ],
  [ MSG_GET_APPLICATIONS ] : [
  ],
  [ MSG_GET_ORACLES ] : [
  ],

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  sending data to a node                                                                                                    //
  // -------------------------------------------------------------------------------------------------------------------------- //
  [ MSG_SEND_MICROBLOCK ] : [
    { name: "data", type: DATA.BINARY }
  ],

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  answers                                                                                                                   //
  // -------------------------------------------------------------------------------------------------------------------------- //
  [ MSG_ANS_OK ] : [
  ],
  [ MSG_ANS_HASH ] : [
    { name: "hash", type: DATA.HASH }
  ],
  [ MSG_ANS_STRING ] : [
    { name: "string", type: DATA.STRING }
  ],
  [ MSG_ANS_FILE ] : [
    { name: "data", type: DATA.BINARY }
  ],
  [ MSG_ANS_CHAIN_STATUS ] : [
    { name: "lastBlockHeight",  type: DATA.UINT48 },
    { name: "timeToNextBlock",  type: DATA.UINT16 },
    { name: "nSection",         type: DATA.UINT48 },
    { name: "nMicroblock",      type: DATA.UINT48 },
    { name: "nAccountVb",       type: DATA.UINT48 },
    { name: "nValidatorNodeVb", type: DATA.UINT48 },
    { name: "nOrganizationVb",  type: DATA.UINT48 },
    { name: "nAppUserVb",       type: DATA.UINT48 },
    { name: "nApplicationVb",   type: DATA.UINT48 },
    { name: "nAppLedgerVb",     type: DATA.UINT48 },
    { name: "nOracleVb",        type: DATA.UINT48 }
  ],
  [ MSG_ANS_BLOCK_LIST ] : [
    {
      name: "list",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: [
        { name: "height", type: DATA.UINT48 },
        { name: "status", type: DATA.UINT8 },
        ...DB[DB_BLOCK_INFO]
      ]
    }
  ],
  [ MSG_ANS_BLOCK_INFO ] : [
    { name: "height", type: DATA.UINT48 },
    { name: "status", type: DATA.UINT8 },
    ...DB[DB_BLOCK_INFO]
  ],
  [ MSG_ANS_BLOCK_CONTENT ] : [
    { name: "timestamp",      type: DATA.UINT48 },
    { name: "proposerNode",   type: DATA.HASH },
    { name: "previousHash",   type: DATA.HASH },
    { name: "height",         type: DATA.UINT48 },
    { name: "merkleRootHash", type: DATA.HASH },
    { name: "radixRootHash",  type: DATA.HASH },
    { name: "chainId",        type: DATA.STRING },
    DB[DB_BLOCK_CONTENT][0]
  ],
  [ MSG_ANS_VB_INFO ] : [
    { name: "type",           type: DATA.UINT8 },
    { name: "height",         type: DATA.UINT48 },
    { name: "lastMicroblock", type: DATA.HASH }
  ],
  [ MSG_ANS_VB_CONTENT ] : [
    { name: "type", type: DATA.UINT8 },
    { name: "list", type: DATA.HASH | DATA.ARRAY }
  ],
  [ MSG_ANS_RAW_MICROBLOCK ] : [
    { name: "vbHash",  type: DATA.HASH },
    { name: "vbType",  type: DATA.UINT8 },
    { name: "content", type: DATA.BINARY }
  ],
  [ MSG_ANS_RAW_MICROBLOCKS ] : [
    {
      name: "list",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: [
        { name: "vbHash",  type: DATA.HASH },
        { name: "vbType",  type: DATA.UINT8 },
        { name: "content", type: DATA.BINARY }
      ]
    }
  ],
  [ MSG_ANS_ACCEPT_MICROBLOCK ] : [
    { name: "vbHash", type: DATA.HASH },
    { name: "mbHash", type: DATA.HASH },
    { name: "height", type: DATA.UINT48 }
  ],
  [ MSG_ANS_ACCOUNT_STATE ] : DB[DB_ACCOUNT_STATE],
  [ MSG_ANS_ACCOUNT_HISTORY ] : [
    {
      name: "list",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: DB[DB_ACCOUNT_HISTORY]
    }
  ],
  [ MSG_ANS_ACCOUNT_BY_PUBLIC_KEY ] : [
    { name: "accountHash", type: DATA.HASH }
  ],
  [ MSG_ANS_ANCHORING ] : [
    { name: "block",  type: DATA.UINT48 },
    { name: "index",  type: DATA.UINT32 },
    { name: "offset", type: DATA.UINT32 }
  ],
  [ MSG_ANS_OBJECT_LIST ] : [
    { name: "list", type: DATA.HASH | DATA.ARRAY }
  ],
  [ MSG_ANS_ERROR ] : [
    { name: "error", type: DATA.OBJECT, schema: ERROR }
  ]
};

// ============================================================================================================================ //
//  Wallet <-> operator network messages                                                                                        //
// ============================================================================================================================ //
export const MSG_APPROVAL_HANDSHAKE     = 0x00;
export const MSG_ACTOR_KEY              = 0x01;
export const MSG_APPROVAL_SIGNATURE     = 0x02;

export const MSG_ANS_ACTOR_KEY_REQUIRED = 0x80;
export const MSG_ANS_APPROVAL_DATA      = 0x81;
export const MSG_ANS_APPROVAL_SIGNATURE = 0x82;

export const WALLET_OP_MESSAGES = {
  [ MSG_APPROVAL_HANDSHAKE ] : [
    { name: "dataId", type: DATA.HASH }
  ],
  [ MSG_ACTOR_KEY ] : [
    { name: "dataId",   type: DATA.HASH },
    { name: "actorKey", type: DATA.PUB_KEY }
  ],
  [ MSG_APPROVAL_SIGNATURE ] : [
    { name: "dataId",    type: DATA.HASH },
    { name: "signature", type: DATA.SIGNATURE }
  ],
  [ MSG_ANS_ACTOR_KEY_REQUIRED ] : [
    { name: "genesisSeed", type: DATA.HASH }
  ],
  [ MSG_ANS_APPROVAL_DATA ] : [
    { name: "data", type: DATA.BINARY }
  ],
  [ MSG_ANS_APPROVAL_SIGNATURE ] : [
    { name: "vbHash", type: DATA.HASH },
    { name: "mbHash", type: DATA.HASH },
    { name: "height", type: DATA.UINT48 }
  ],
  [ MSG_ANS_ERROR ] : [
    { name: "error", type: DATA.OBJECT, schema: ERROR }
  ]
};

// ============================================================================================================================ //
//  Operator <-> operator network messages                                                                                      //
// ============================================================================================================================ //
export const MSG_SUBMIT_ORACLE_REQUEST      = 0x00;
export const MSG_CONFIRM_ORACLE_REQUEST     = 0x01;
export const MSG_ORACLE_ANSWER              = 0x02;

export const MSG_ANS_SUBMIT_ORACLE_REQUEST  = 0x80;
export const MSG_ANS_CONFIRM_ORACLE_REQUEST = 0x81;

export const ORACLE_REQUEST_BODY = [
  { name: "organizationId", type: DATA.HASH },
  { name: "oracleId",       type: DATA.HASH },
  { name: "serviceName",    type: DATA.STRING },
  { name: "data",           type: DATA.BINARY }
];

export const OP_OP_MESSAGES = {
  // initial oracle request submission
  // 'body' is the serialization of the ORACLE_REQUEST_BODY schema
  [ MSG_SUBMIT_ORACLE_REQUEST ] : [
    { name: "body",      type: DATA.BINARY },
    { name: "signature", type: DATA.SIGNATURE }
  ],
  // oracle request confirmation with payment reference
  [ MSG_CONFIRM_ORACLE_REQUEST ] : [
    { name: "requestId",         type: DATA.HASH },
    { name: "paymentMicroblock", type: DATA.HASH }
  ],
  // oracle answer
  [ MSG_ORACLE_ANSWER ] : [
    { name: "requestId", type: DATA.HASH },
    { name: "answer",    type: DATA.BINARY },
    { name: "signature", type: DATA.SIGNATURE }
  ],

  // answer to initial oracle request submission
  [ MSG_ANS_SUBMIT_ORACLE_REQUEST ] : [
    { name: "requestId", type: DATA.HASH },
    { name: "price",     type: DATA.UINT48 }
  ],
  // answer to oracle request confirmation
  [ MSG_ANS_CONFIRM_ORACLE_REQUEST ] : [
    { name: "redirect", type: DATA.STRING }
  ],

  [ MSG_ANS_ERROR ] : [
    { name: "error", type: DATA.OBJECT, schema: ERROR }
  ]
};

// ============================================================================================================================ //
//  Sections                                                                                                                    //
// ============================================================================================================================ //
export const ACCESS_RULE = [
  { name: "path", type: DATA.UINT8 | DATA.ARRAY }
];

export const PRIVATE_DATA = [
  { name: "padding", type: DATA.BINARY },
  { name: "data",    type: DATA.BINARY }
];

export const PROVABLE_DATA = [
  { name: "merklePepper", type: DATA.BINARY },
  { name: "padding",      type: DATA.BINARY },
  { name: "data",         type: DATA.BINARY }
];

export const SUBSECTION = [
  { name: "type",           type: DATA.UINT8 },
  { name: "keyId",          type: DATA.UINT16, condition: parent => parent.type & DATA.SUB_PRIVATE },
  { name: "accessRules",    type: DATA.OBJECT | DATA.ARRAY, schema: ACCESS_RULE, condition: parent => parent.type & DATA.SUB_ACCESS_RULES },
  { name: "merkleRootHash", type: DATA.HASH, condition: parent => parent.type & DATA.SUB_PROVABLE },
  { name: "data",           type: DATA.BINARY }
];

export const SECTION = [
  { name: "id",          type: DATA.UINT8 },
  { name: "schemaInfo",  type: DATA.BINARY, condition: parent => parent.id & DATA.EXTERNAL_SCHEMA },
  { name: "subsections", type: DATA.OBJECT | DATA.ARRAY, schema: SUBSECTION }
];

// ============================================================================================================================ //
//  Microblocks                                                                                                                 //
// ============================================================================================================================ //
export const MICROBLOCK_HEADER = [
  { name: "magicString",     type: DATA.STRING, size: 4 },
  { name: "protocolVersion", type: DATA.UINT16 },
  { name: "height",          type: DATA.UINT48 },
  { name: "previousHash",    type: DATA.HASH },
  { name: "timestamp",       type: DATA.UINT48 },
  { name: "gas",             type: DATA.UINT24 },
  { name: "gasPrice",        type: DATA.UINT32 }
];

export const MICROBLOCK_BODY = [
  { name: "sections", type: DATA.BINARY | DATA.ARRAY }
];

export const MICROBLOCK = [
  { name: "header", type: DATA.OBJECT, schema: MICROBLOCK_HEADER },
  { name: "body",   type: DATA.OBJECT, schema: MICROBLOCK_BODY }
];

// ============================================================================================================================ //
//  Components for application and oracle definitions                                                                           //
// ============================================================================================================================ //
export const FIELD = [
  { name: "name",       type: DATA.STRING },
  { name: "type",       type: DATA.UINT16 },
  { name: "structType", type: DATA.UINT8, condition: parent => parent.type & DATA.STRUCT },
  { name: "maskId",     type: DATA.UINT16, condition: parent => parent.type & DATA.MASKABLE }
];

export const INTERNAL_STRUCTURE = [
  { name: "name",       type: DATA.STRING },
  { name: "properties", type: DATA.OBJECT | DATA.ARRAY, schema: FIELD }
];

export const ORACLE_STRUCTURE = [
  { name: "oracle",      type: DATA.HASH },
  { name: "version",     type: DATA.UINT16 },
  { name: "serviceName", type: DATA.STRING }
];

export const ENUMERATION = [
  { name: "name",   type: DATA.STRING },
  { name: "values", type: DATA.STRING | DATA.ARRAY }
];

export const MASK = [
  { name: "name",         type: DATA.STRING },
  { name: "regex",        type: DATA.STRING },
  { name: "substitution", type: DATA.STRING }
];

// ============================================================================================================================ //
//  Application definition                                                                                                      //
// ============================================================================================================================ //
export const MESSAGE_FIELD = [
  { name: "type", type: DATA.UINT8 },
  { name: "path", type: DATA.UINT8 | DATA.ARRAY }
];

export const APPLICATION_MESSAGE = [
  { name: "name",   type: DATA.STRING },
  { name: "texts",  type: DATA.STRING | DATA.ARRAY },
  { name: "fields", type: DATA.OBJECT | DATA.ARRAY, schema: MESSAGE_FIELD }
];

export const APPLICATION_DEFINITION = [
  { name: "fields",             type: DATA.OBJECT | DATA.ARRAY, schema: FIELD },
  { name: "internalStructures", type: DATA.OBJECT | DATA.ARRAY, schema: INTERNAL_STRUCTURE },
  { name: "oracleStructures",   type: DATA.OBJECT | DATA.ARRAY, schema: ORACLE_STRUCTURE },
  { name: "enumerations",       type: DATA.OBJECT | DATA.ARRAY, schema: ENUMERATION },
  { name: "masks",              type: DATA.OBJECT | DATA.ARRAY, schema: MASK },
  { name: "messages",           type: DATA.OBJECT | DATA.ARRAY, schema: APPLICATION_MESSAGE }
];

// ============================================================================================================================ //
//  Oracle definition                                                                                                           //
// ============================================================================================================================ //
export const ORACLE_SERVICE = [
  { name: "name",    type: DATA.STRING },
  { name: "request", type: DATA.OBJECT | DATA.ARRAY, schema: FIELD },
  { name: "answer",  type: DATA.OBJECT | DATA.ARRAY, schema: FIELD }
];

export const ORACLE_DEFINITION = [
  { name: "services",           type: DATA.OBJECT | DATA.ARRAY, schema: ORACLE_SERVICE },
  { name: "internalStructures", type: DATA.OBJECT | DATA.ARRAY, schema: INTERNAL_STRUCTURE },
  { name: "enumerations",       type: DATA.OBJECT | DATA.ARRAY, schema: ENUMERATION },
  { name: "masks",              type: DATA.OBJECT | DATA.ARRAY, schema: MASK }
];

// ============================================================================================================================ //
//  Proofs                                                                                                                      //
// ============================================================================================================================ //
export const PROOF_DATA = [
  { name: "provable",  type: DATA.UINT8 },
  { name: "modeList",  type: DATA.UINT8 | DATA.ARRAY, condition: parent => parent.provable },
  { name: "dataList",  type: DATA.BINARY | DATA.ARRAY, condition: parent => parent.provable },
  { name: "proofList", type: DATA.BINARY | DATA.ARRAY, condition: parent => parent.provable }
];

export const PROOF_LIST = [
  { name: "list", type: DATA.OBJECT | DATA. ARRAY, schema: PROOF_DATA }
];

// ============================================================================================================================ //
//  Wallet interface                                                                                                            //
// ============================================================================================================================ //
export const WI_MAX_SERVER_URL_LENGTH = 100;

export const WI_QR_CODE = [
  { name: "qrId",      type: DATA.BIN128 },
  { name: "timestamp", type: DATA.UINT48 },
  { name: "serverUrl", type: DATA.STRING, size: WI_MAX_SERVER_URL_LENGTH }
];

// client -> server
export const WIMSG_REQUEST             = 0x0;

// server -> client
export const WIMSG_UPDATE_QR           = 0x1;
export const WIMSG_CONNECTION_TOKEN    = 0x2;
export const WIMSG_FORWARDED_ANSWER    = 0x3;

// wallet -> server
export const WIMSG_GET_CONNECTION_INFO = 0x4;
export const WIMSG_ANSWER              = 0x5;

// server -> wallet
export const WIMSG_CONNECTION_INFO     = 0x6;
export const WIMSG_CONNECTION_ACCEPTED = 0x7;
export const WIMSG_FORWARDED_REQUEST   = 0x8;

export const WI_MESSAGES = {
  [ WIMSG_REQUEST ]: [
    { name: "requestType", type: DATA.UINT8 },
    { name: "request",     type: DATA.BINARY },
    { name: "deviceId",    type: DATA.BIN128 },
    { name: "withToken",   type: DATA.UINT8 },
    { name: "token",       type: DATA.BIN256, condition: parent => parent.withToken }
  ],
  [ WIMSG_UPDATE_QR ]: [
    { name: "qrId",      type: DATA.BIN128 },
    { name: "timestamp", type: DATA.UINT48 }
  ],
  [ WIMSG_CONNECTION_TOKEN ]: [
    { name: "token", type: DATA.BIN256 }
  ],
  [ WIMSG_FORWARDED_ANSWER ]: [
    { name: "answerType", type: DATA.UINT8 },
    { name: "answer",     type: DATA.BINARY }
  ],
  [ WIMSG_GET_CONNECTION_INFO ]: [
    { name: "qrId", type: DATA.BIN128 }
  ],
  [ WIMSG_ANSWER ]: [
    { name: "answerType", type: DATA.UINT8 },
    { name: "answer",     type: DATA.BINARY }
  ],
  [ WIMSG_CONNECTION_INFO ]: [
  ],
  [ WIMSG_CONNECTION_ACCEPTED ]: [
    { name: "qrId", type: DATA.BIN128 }
  ],
  [ WIMSG_FORWARDED_REQUEST ]: [
    { name: "requestType", type: DATA.UINT8 },
    { name: "request",     type: DATA.BINARY }
  ]
};

export const WIRQ_AUTH_BY_PUBLIC_KEY = 0x0;
export const WIRQ_DATA_APPROVAL      = 0x1;
export const WIRQ_GET_EMAIL          = 0x2;
export const WIRQ_GET_USER_DATA      = 0x3;

export const WI_REQUESTS = {
  [ WIRQ_AUTH_BY_PUBLIC_KEY ]: [
    { name: "challenge", type: DATA.BIN256 }
  ],
  [ WIRQ_GET_EMAIL ]: [],
  [ WIRQ_GET_USER_DATA ]: [
    { name: "requiredData", type: DATA.ARRAY | DATA.STRING }
  ],
  [ WIRQ_DATA_APPROVAL ]: [
    { name: "dataId", type: DATA.HASH },
    { name: "serverUrl", type: DATA.STRING }
  ]
};

export const WI_ANSWERS = {
  [ WIRQ_AUTH_BY_PUBLIC_KEY ]: [
    { name: "publicKey", type: DATA.PUB_KEY },
    { name: "signature", type: DATA.SIGNATURE }
  ],
  [ WIRQ_GET_EMAIL ]: [
    { name: "email", type: DATA.STRING }
  ],
  [ WIRQ_DATA_APPROVAL ]: [
    { name: "vbHash", type: DATA.HASH },
    { name: "mbHash", type: DATA.HASH },
    { name: "height", type: DATA.UINT48 }
  ],
  [ WIRQ_GET_USER_DATA ]: [
    { name: "userData", type: DATA.STRING | DATA.ARRAY }
  ],
};
