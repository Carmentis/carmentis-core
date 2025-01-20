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
    { name: "publicKey",   type: DATA.PUB_KEY | DATA.OPTIONAL },
    { name: "payees",      type: DATA.HASH | DATA.ARRAY },
    { name: "nextPayeeId", type: DATA.UINT8 }
  ],
  [ ID.OBJ_VALIDATION_NODE ] : [
  ],
  [ ID.OBJ_ORGANIZATION ] : [
    { name: "publicKey", type: DATA.PUB_KEY | DATA.OPTIONAL }
  ],
  [ ID.OBJ_APP_USER ] : [
  ],
  [ ID.OBJ_APPLICATION ] : [
    { name: "organizationId", type: DATA.HASH }
  ],
  [ ID.OBJ_APP_LEDGER ] : [
  ],
  [ ID.OBJ_ORACLE ] : [
  ]
};

// ============================================================================================================================ //
//  Database tables                                                                                                             //
// ============================================================================================================================ //
export const DB_MICROBLOCK_INFO       = 0x0;
export const DB_MICROBLOCK_DATA       = 0x1;
export const DB_VB_INFO               = 0x2;
export const DB_BLOCK                 = 0x3;
export const DB_ACCOUNT_STATE         = 0x4;
export const DB_ACCOUNT_HISTORY       = 0x5;
export const DB_ACCOUNT_BY_PUBLIC_KEY = 0x6;

export const DB = {
  // microblock meta information
  // key: microblock hash
  [ DB_MICROBLOCK_INFO ] : [
    { name: "vbHash",       type: DATA.HASH },
    { name: "vbType",       type: DATA.UINT8 },
    { name: "previousHash", type: DATA.HASH },
    { name: "block",        type: DATA.UINT48 },
    { name: "index",        type: DATA.UINT32 }
  ],

  // microblock content
  // key: microblock hash
  [ DB_MICROBLOCK_DATA ] : [
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

  // block meta information
  // key: block height
  [ DB_BLOCK ] : [
    {
      name: "microBlock",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: [
        { name: "hash",     type: DATA.HASH },
        { name: "vbHash",   type: DATA.HASH },
        { name: "type",     type: DATA.UINT8 },
        { name: "height",   type: DATA.UINT48 },
        { name: "size",     type: DATA.UINT48 },
        { name: "nSection", type: DATA.UINT48 }
      ]
    }
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
  ]
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
//  Network messages                                                                                                            //
// ============================================================================================================================ //
export const MSG_GET_CHAIN_STATUS          = 0x00;
export const MSG_GET_BLOCK_LIST            = 0x01;
export const MSG_GET_BLOCK                 = 0x02;
export const MSG_GET_VB_INFO               = 0x03;
export const MSG_GET_VB_CONTENT            = 0x04;
export const MSG_GET_MICROBLOCK            = 0x05;
export const MSG_GET_MICROBLOCKS           = 0x06;
export const MSG_GET_ACCOUNT_STATE         = 0x07;
export const MSG_GET_ACCOUNT_HISTORY       = 0x08;
export const MSG_GET_ACCOUNT_BY_PUBLIC_KEY = 0x09;
export const MSG_SEND_MICROBLOCK           = 0x0A;

export const MSG_ANS_OK                    = 0x80;
export const MSG_ANS_HASH                  = 0x81;
export const MSG_ANS_STRING                = 0x82;
export const MSG_ANS_FILE                  = 0x83;
export const MSG_ANS_CHAIN_STATUS          = 0x84;
export const MSG_ANS_BLOCK_LIST            = 0x85;
export const MSG_ANS_BLOCK                 = 0x86;
export const MSG_ANS_VB_INFO               = 0x87;
export const MSG_ANS_VB_CONTENT            = 0x88;
export const MSG_ANS_MICROBLOCK            = 0x89;
export const MSG_ANS_MICROBLOCKS           = 0x8A;
export const MSG_ANS_ACCOUNT_STATE         = 0x8B;
export const MSG_ANS_ACCOUNT_HISTORY       = 0x8C;
export const MSG_ANS_ACCOUNT_BY_PUBLIC_KEY = 0x8D;
export const MSG_ANS_ACCEPT_MICROBLOCK     = 0x8E;
export const MSG_ANS_CONSUMPTION           = 0x8F;
export const MSG_ANS_ANCHORING             = 0x90;

export const MSG_ANS_ERROR                 = 0xFF;

export const MSG_NAMES = {
  [ MSG_GET_CHAIN_STATUS          ]: "GET_CHAIN_STATUS",
  [ MSG_GET_BLOCK_LIST            ]: "GET_BLOCK_LIST",
  [ MSG_GET_BLOCK                 ]: "GET_BLOCK",
  [ MSG_GET_VB_INFO               ]: "GET_VB_INFO",
  [ MSG_GET_VB_CONTENT            ]: "GET_VB_CONTENT",
  [ MSG_GET_MICROBLOCK            ]: "GET_MICROBLOCK",
  [ MSG_GET_MICROBLOCKS           ]: "GET_MICROBLOCKS",
  [ MSG_GET_ACCOUNT_STATE         ]: "GET_ACCOUNT_STATE",
  [ MSG_GET_ACCOUNT_HISTORY       ]: "GET_ACCOUNT_HISTORY",
  [ MSG_GET_ACCOUNT_BY_PUBLIC_KEY ]: "GET_ACCOUNT_BY_PUBLIC_KEY",
  [ MSG_SEND_MICROBLOCK           ]: "SEND_MICROBLOCK",
};

export const MESSAGES = {
  // -------------------------------------------------------------------------------------------------------------------------- //
  //  retrieving data from a node                                                                                               //
  // -------------------------------------------------------------------------------------------------------------------------- //
  [ MSG_GET_CHAIN_STATUS ] : [
    // no argument
  ],
  [ MSG_GET_BLOCK_LIST ] : [
    { name: "firstBlockId", type: DATA.UINT48 },
    { name: "maxRecords",   type: DATA.UINT16 }
  ],
  [ MSG_GET_BLOCK ] : [
    { name: "height", type: DATA.UINT48 }
  ],
  [ MSG_GET_VB_INFO ] : [
    { name: "vbHash", type: DATA.HASH }
  ],
  [ MSG_GET_VB_CONTENT ] : [
    { name: "vbHash", type: DATA.HASH }
  ],
  [ MSG_GET_MICROBLOCK ] : [
    { name: "mbHash", type: DATA.HASH }
  ],
  [ MSG_GET_MICROBLOCKS ] : [
    { name: "list", type: DATA.HASH | DATA.ARRAY }
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
    { name: "lastBlockId",     type: DATA.UINT48 },
    { name: "timeToNextBlock", type: DATA.UINT16 },
    { name: "nSection",        type: DATA.UINT48 },
    { name: "nMicroblock",     type: DATA.UINT48 },
    { name: "nOrganization",   type: DATA.UINT48 },
    { name: "nValidationNode", type: DATA.UINT48 },
    { name: "nAppUser",        type: DATA.UINT48 },
    { name: "nApplication",    type: DATA.UINT48 },
    { name: "nAppLedger",      type: DATA.UINT48 }
  ],
  [ MSG_ANS_BLOCK_LIST ] : [
    {
      name: "list",
      type: DATA.OBJECT | DATA.ARRAY,
      schema: [
        { name: "id",          type: DATA.UINT48 },
        { name: "status",      type: DATA.UINT8 },
        { name: "timestamp",   type: DATA.UINT48 },
        { name: "hash",        type: DATA.HASH },
        { name: "node",        type: DATA.HASH },
        { name: "size",        type: DATA.UINT48 },
        { name: "nMicroblock", type: DATA.UINT48 }
      ]
    }
  ],
  [ MSG_ANS_BLOCK ] : [
    { name: "header", type: DATA.OBJECT, schema: [
        { name: "ts",             type: DATA.UINT48 },
        { name: "nodeId",         type: DATA.BINARY, size: 20 },
        { name: "previousHash",   type: DATA.HASH },
        { name: "height",         type: DATA.UINT48 },
        { name: "merkleRootHash", type: DATA.HASH },
        { name: "radixRootHash",  type: DATA.HASH },
        { name: "chainId",        type: DATA.STRING }
      ]
    },
    DB_BLOCK[0]
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
  [ MSG_ANS_MICROBLOCK ] : [
    { name: "microChainId", type: DATA.HASH },
    { name: "type",         type: DATA.UINT8 },
    { name: "block",        type: DATA.UINT48 },
    { name: "index",        type: DATA.UINT32 },
    { name: "offset",       type: DATA.UINT32 },
    { name: "content",      type: DATA.BINARY }
  ],
  [ MSG_ANS_MICROBLOCKS ] : [
    { name: "list", type: DATA.BINARY | DATA.ARRAY }
  ],
  [ MSG_ANS_ACCEPT_MICROBLOCK ] : [
    { name: "microChainId", type: DATA.HASH },
    { name: "microBlockId", type: DATA.HASH },
    { name: "height",       type: DATA.UINT48 }
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
  [ MSG_ANS_CONSUMPTION ] : [
    { name: "appLedgers", type: DATA.UINT48 },
    { name: "records",    type: DATA.UINT48 },
    { name: "bytes",      type: DATA.UINT48 }
  ],
  [ MSG_ANS_ANCHORING ] : [
    { name: "block",  type: DATA.UINT48 },
    { name: "index",  type: DATA.UINT32 },
    { name: "offset", type: DATA.UINT32 }
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
  { name: "keyType",        type: DATA.UINT8, condition: parent => parent.type & DATA.SUB_PRIVATE },
  { name: "keyIndex",       type: DATA.UINT8, condition: parent => parent.type & DATA.SUB_PRIVATE },
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
  { name: "name",   type: DATA.STRING },
  { name: "type",   type: DATA.UINT16 },
  { name: "maskId", type: DATA.UINT16, condition: parent => parent.type & DATA.MASKABLE }
];

export const STRUCTURE = [
  { name: "name",       type: DATA.STRING },
  { name: "properties", type: DATA.OBJECT | DATA.ARRAY, schema: FIELD }
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
  { name: "fields",       type: DATA.OBJECT | DATA.ARRAY, schema: FIELD },
  { name: "structures",   type: DATA.OBJECT | DATA.ARRAY, schema: STRUCTURE },
  { name: "enumerations", type: DATA.OBJECT | DATA.ARRAY, schema: ENUMERATION },
  { name: "masks",        type: DATA.OBJECT | DATA.ARRAY, schema: MASK },
  { name: "messages",     type: DATA.OBJECT | DATA.ARRAY, schema: APPLICATION_MESSAGE }
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
  { name: "services",     type: DATA.OBJECT | DATA.ARRAY, schema: ORACLE_SERVICE },
  { name: "structures",   type: DATA.OBJECT | DATA.ARRAY, schema: STRUCTURE },
  { name: "enumerations", type: DATA.OBJECT | DATA.ARRAY, schema: ENUMERATION },
  { name: "masks",        type: DATA.OBJECT | DATA.ARRAY, schema: MASK }
];

// ============================================================================================================================ //
//  Wallet interface                                                                                                            //
// ============================================================================================================================ //
export const WI_MAX_SERVER_URL_LENGTH = 120;

export const WI_QR_CODE = [
  { name: "qrId",      type: DATA.BIN128 },
  { name: "timestamp", type: DATA.UINT48 },
  { name: "serverUrl", type: DATA.STRING, size: WI_MAX_SERVER_URL_LENGTH }
];
