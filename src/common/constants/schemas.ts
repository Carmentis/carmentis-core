import * as CHAIN from "./chain";
import * as DATA from "./data";

export interface SchemaItem {
  name: string;
  type: number;
  size?: number;
  schema?: Schema;
  definition?: SchemaItem[];
  optional?: boolean;
  unspecifiedSchema?: boolean;
}

export interface Schema {
  label: string;
  definition: SchemaItem[];
}

// ============================================================================================================================ //
//  Error                                                                                                                       //
// ============================================================================================================================ //
export const ERROR: Schema = {
  label: "Error",
  definition: [
    { name: "type", type: DATA.TYPE_UINT8 },
    { name: "id",   type: DATA.TYPE_UINT8 },
    { name: "arg",  type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
  ]
};

// ============================================================================================================================ //
//  Record description                                                                                                          //
// ============================================================================================================================ //
const RECORD_ACTOR: Schema = {
  label: "RecordActor",
  definition: [
    { name: "name", type: DATA.TYPE_STRING }
  ]
};

const RECORD_CHANNEL: Schema = {
  label: "RecordChannel",
  definition: [
    { name: "name",   type: DATA.TYPE_STRING },
    { name: "public", type: DATA.TYPE_BOOLEAN }
  ]
};

const RECORD_CHANNEL_ASSIGNATION: Schema = {
  label: "RecordChannelAssignation",
  definition: [
    { name: "fieldPath",   type: DATA.TYPE_STRING },
    { name: "channelName", type: DATA.TYPE_STRING }
  ]
};

const RECORD_ACTOR_ASSIGNATION: Schema = {
  label: "RecordActorAssignation",
  definition: [
    { name: "actorName",   type: DATA.TYPE_STRING },
    { name: "channelName", type: DATA.TYPE_STRING }
  ]
};

const RECORD_MASKED_PART: Schema = {
  label: "RecordMaskedPart",
  definition: [
    { name: "position",          type: DATA.TYPE_UINT32 },
    { name: "length",            type: DATA.TYPE_UINT32 },
    { name: "replacementString", type: DATA.TYPE_STRING }
  ]
};

const RECORD_MASKABLE_FIELD: Schema = {
  label: "RecordMaskableField",
  definition: [
    { name: "fieldPath",   type: DATA.TYPE_STRING },
    { name: "maskedParts", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: RECORD_MASKED_PART }
  ]
};

const RECORD_HASHABLE_FIELD: Schema = {
  label: "RecordHashableField",
  definition: [
    { name: "fieldPath", type: DATA.TYPE_STRING }
  ]
};

export const RECORD_DESCRIPTION: Schema = {
  label: "RecordDescription",
  definition: [
    { name: "applicationId",       type: DATA.TYPE_HASH_STR },
    { name: "virtualBlockchainId", type: DATA.TYPE_HASH_STR, optional: true },
    { name: "data",                type: DATA.TYPE_OBJECT, unspecifiedSchema: true },
    { name: "actors",              type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_ACTOR },
    { name: "channels",            type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_CHANNEL },
    { name: "channelAssignations", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_CHANNEL_ASSIGNATION },
    { name: "actorAssignations",   type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_ACTOR_ASSIGNATION },
    { name: "hashableFields",      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_HASHABLE_FIELD },
    { name: "maskableFields",      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, optional: true, schema: RECORD_MASKABLE_FIELD },
    { name: "author",              type: DATA.TYPE_STRING },
    { name: "endorser",            type: DATA.TYPE_STRING, optional: true }
  ]
};

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
export const ACCOUNT_STATE: Schema = {
  label: "AccountState",
  definition: [
    { name: "height",          type: DATA.TYPE_UINT48 },
    { name: "balance",         type: DATA.TYPE_UINT48 },
    { name: "lastHistoryHash", type: DATA.TYPE_BIN256 }
  ]
};

export const ACCOUNT_HISTORY: Schema = {
  label: "AccountHistory",
  definition: [
    { name: "height",              type: DATA.TYPE_UINT48 },
    { name: "previousHistoryHash", type: DATA.TYPE_BIN256 },
    { name: "type",                type: DATA.TYPE_UINT8 },
    { name: "timestamp",           type: DATA.TYPE_UINT48 },
    { name: "linkedAccount",       type: DATA.TYPE_BIN256 },
    { name: "amount",              type: DATA.TYPE_UINT48 },
    { name: "chainReference",      type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Virtual blockchain state                                                                                                    //
// ============================================================================================================================ //
export const VIRTUAL_BLOCKCHAIN_STATE: Schema = {
  label: "VirtualBlockchainState",
  definition: [
    { name: "type",               type: DATA.TYPE_UINT8 },
    { name: "height",             type: DATA.TYPE_UINT48 },
    { name: "lastMicroblockHash", type: DATA.TYPE_BIN256 },
    { name: "customState",        type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Account VB state                                                                                                            //
// ============================================================================================================================ //
const ACCOUNT_VB_STATE: Schema = {
  label: "AccountVbState",
  definition: [
    { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
    { name: "publicKeyHeight",      type: DATA.TYPE_UINT48 }
  ]
};

// ============================================================================================================================ //
//  Validator node VB state                                                                                                     //
// ============================================================================================================================ //
const VALIDATOR_NODE_VB_STATE: Schema = {
  label: "ValidatorNodeVbState",
  definition: [
  ]
};

// ============================================================================================================================ //
//  Organization VB state                                                                                                       //
// ============================================================================================================================ //
const ORGANIZATION_VB_STATE: Schema = {
  label: "OrganizationVbState",
  definition: [
    { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
    { name: "publicKeyHeight",      type: DATA.TYPE_UINT48 },
    { name: "descriptionHeight",    type: DATA.TYPE_UINT48 }
  ]
};

// ============================================================================================================================ //
//  Application VB state                                                                                                        //
// ============================================================================================================================ //
const APPLICATION_VB_STATE: Schema = {
  label: "ApplicationVbState",
  definition: [
    { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
    { name: "organizationId",       type: DATA.TYPE_BIN256 },
    { name: "descriptionHeight",    type: DATA.TYPE_UINT48 }
  ]
};

// ============================================================================================================================ //
//  Application ledger VB state                                                                                                 //
// ============================================================================================================================ //
const APP_LEDGER_VB_STATE: Schema = {
  label: "AppLedgerVbState",
  definition: [
    { name: "signatureAlgorithmId", type: DATA.TYPE_UINT8 },
    { name: "applicationId",        type: DATA.TYPE_BIN256 },
    {
      name: "channels",
      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
      definition: [
        { name: "name",      type: DATA.TYPE_STRING },
        { name: "isPrivate", type: DATA.TYPE_BOOLEAN },
        { name: "creatorId", type: DATA.TYPE_UINT8 }
      ]
    },
    {
      name: "actors",
      type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
      definition: [
        { name: "name",       type: DATA.TYPE_STRING },
        { name: "subscribed", type: DATA.TYPE_BOOLEAN },
        {
          name: "invitations",
          type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
          definition: [
            { name: "channelId", type: DATA.TYPE_UINT8 },
            { name: "height",    type: DATA.TYPE_UINT48 }
          ]
        }
      ]
    }
  ]
};

// ============================================================================================================================ //
//  All VB state schemas                                                                                                        //
// ============================================================================================================================ //
export const VB_STATES: Schema[] = [
  ACCOUNT_VB_STATE,
  VALIDATOR_NODE_VB_STATE,
  ORGANIZATION_VB_STATE,
  APPLICATION_VB_STATE,
  APP_LEDGER_VB_STATE
];

// ============================================================================================================================ //
//  Microblock                                                                                                                  //
// ============================================================================================================================ //
export const MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET = 12;
export const MICROBLOCK_HEADER_BODY_HASH_OFFSET = 57;
export const MICROBLOCK_HEADER_SIZE = 89;

export const MICROBLOCK_HEADER: Schema = {
  label: "MicroblockHeader",
  definition: [
    { name: "magicString",     type: DATA.TYPE_STRING, size: 4 }, // +0
    { name: "protocolVersion", type: DATA.TYPE_UINT16 },          // +4
    { name: "height",          type: DATA.TYPE_UINT48 },          // +6
    { name: "previousHash",    type: DATA.TYPE_BIN256 },          // +12
    { name: "timestamp",       type: DATA.TYPE_UINT48 },          // +44
    { name: "gas",             type: DATA.TYPE_UINT24 },          // +50
    { name: "gasPrice",        type: DATA.TYPE_UINT32 },          // +53
    { name: "bodyHash",        type: DATA.TYPE_BIN256 }           // +57
  ]
};

export const MICROBLOCK_SECTION: Schema = {
  label: "MicroblockSection",
  definition: [
    { name: "type", type: DATA.TYPE_UINT8 },
    { name: "data", type: DATA.TYPE_BINARY }
  ]
};

export const MICROBLOCK_BODY: Schema = {
  label: "MicroblockBody",
  definition: [
    { name: "body", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: MICROBLOCK_SECTION }
  ]
};

export const MICROBLOCK_INFORMATION: Schema = {
  label: "MicroblockInformation",
  definition: [
    { name: "virtualBlockchainId",   type: DATA.TYPE_BIN256 },
    { name: "virtualBlockchainType", type: DATA.TYPE_UINT8 },
    { name: "header",                type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Node messages                                                                                                               //
// ============================================================================================================================ //
export const NODE_MESSAGES: Schema[] = [
  {
    label: "MessageError",
    definition: [
      { name: "error", type: DATA.TYPE_STRING }
    ]
  },
  {
    label: "MessageGetVirtualBlockchainState",
    definition: [
      { name: "virtualBlockchainId", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageVirtualBlockchainState",
    definition: [
      { name: "stateData", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageGetVirtualBlockchainUpdate",
    definition: [
      { name: "virtualBlockchainId", type: DATA.TYPE_BIN256 },
      { name: "knownHeight",         type: DATA.TYPE_UINT48 }
    ]
  },
  {
    label: "MessageVirtualBlockchainUpdate",
    definition: [
      { name: "exists",    type: DATA.TYPE_BOOLEAN },
      { name: "changed",   type: DATA.TYPE_BOOLEAN },
      { name: "stateData", type: DATA.TYPE_BINARY },
      { name: "headers",   type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageGetMicroblockInformation",
    definition: [
      { name: "hash", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageMicroblockInformation",
    definition: MICROBLOCK_INFORMATION.definition
  },
  {
    label: "MessageAwaitMicroblockAnchoring",
    definition: [
      { name: "hash", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageMicroblockAnchoring",
    definition: MICROBLOCK_INFORMATION.definition
  },
  {
    label: "MessageGetMicroblockBodys",
    definition: [
      { name: "hashes", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageMicroblockBodys",
    definition: [
      {
        name: "list",
        type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
        definition: [
          { name: "hash", type: DATA.TYPE_BIN256 },
          { name: "body", type: DATA.TYPE_BINARY }
        ]
      }
    ]
  },
  {
    label: "MessageGetAccountState",
    definition: [
      { name: "accountHash", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageAccountState",
    definition: ACCOUNT_STATE.definition
  },
  {
    label: "MessageGetAccountHistory",
    definition: [
      { name: "accountHash",     type: DATA.TYPE_BIN256 },
      { name: "lastHistoryHash", type: DATA.TYPE_BIN256 },
      { name: "maxRecords",      type: DATA.TYPE_UINT16 }
    ]
  },
  {
    label: "MessageAccountHistory",
    definition: [
      {
        name: "list",
        type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT,
        schema: ACCOUNT_HISTORY
      }
    ]
  },
  {
    label: "MessageGetAccountByPublicKeyHash",
    definition: [
      { name: "publicKeyHash", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageAccountByPublicKeyHash",
    definition: [
      { name: "accountHash", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "MessageGetObjectList",
    definition: [
      { name: "type", type: DATA.TYPE_UINT8 }
    ]
  },
  {
    label: "MessageObjectList",
    definition: [
      { name: "list", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_BIN256 }
    ]
  }
];

export const MSG_ERROR                          = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageError");
export const MSG_GET_VIRTUAL_BLOCKCHAIN_STATE   = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetVirtualBlockchainState");
export const MSG_VIRTUAL_BLOCKCHAIN_STATE       = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageVirtualBlockchainState");
export const MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE  = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetVirtualBlockchainUpdate");
export const MSG_VIRTUAL_BLOCKCHAIN_UPDATE      = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageVirtualBlockchainUpdate");
export const MSG_GET_MICROBLOCK_INFORMATION     = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetMicroblockInformation");
export const MSG_MICROBLOCK_INFORMATION         = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageMicroblockInformation");
export const MSG_AWAIT_MICROBLOCK_ANCHORING     = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageAwaitMicroblockAnchoring");
export const MSG_MICROBLOCK_ANCHORING           = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageMicroblockAnchoring");
export const MSG_GET_MICROBLOCK_BODYS           = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetMicroblockBodys");
export const MSG_MICROBLOCK_BODYS               = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageMicroblockBodys");
export const MSG_GET_ACCOUNT_STATE              = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetAccountState");
export const MSG_ACCOUNT_STATE                  = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageAccountState");
export const MSG_GET_ACCOUNT_HISTORY            = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetAccountHistory");
export const MSG_ACCOUNT_HISTORY                = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageAccountHistory");
export const MSG_GET_ACCOUNT_BY_PUBLIC_KEY_HASH = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetAccountByPublicKeyHash");
export const MSG_ACCOUNT_BY_PUBLIC_KEY_HASH     = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageAccountByPublicKeyHash");
export const MSG_GET_OBJECT_LIST                = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageGetObjectList");
export const MSG_OBJECT_LIST                    = NODE_MESSAGES.findIndex((s: Schema) => s.label == "MessageObjectList");

// ============================================================================================================================ //
//  Wallet interface                                                                                                            //
// ============================================================================================================================ //
export const WI_MAX_SERVER_URL_LENGTH = 100;

export const WI_QR_CODE: Schema = {
  label: "WiQrCode",
  definition: [
    { name: "qrId",      type: DATA.TYPE_BIN256 },
    { name: "timestamp", type: DATA.TYPE_UINT48 },
    { name: "serverUrl", type: DATA.TYPE_STRING, size: WI_MAX_SERVER_URL_LENGTH }
  ]
};

export const WI_MESSAGES: Schema[] = [
  {
    label: "WiMsgRequest",
    definition: [
      { name: "requestType", type: DATA.TYPE_UINT8 },
      { name: "request",     type: DATA.TYPE_BINARY },
      { name: "deviceId",    type: DATA.TYPE_BIN256 },
      { name: "withToken",   type: DATA.TYPE_UINT8 },
      //{ name: "token",       type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "WiMsgUpdateQr",
    definition: [
      { name: "qrId",      type: DATA.TYPE_BIN256 },
      { name: "timestamp", type: DATA.TYPE_UINT48 }
    ]
  },
  {
    label: "WiMsgConnectionToken",
    definition: [
      { name: "token", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "WiMsgForwardedAnswer",
    definition: [
      { name: "answerType", type: DATA.TYPE_UINT8 },
      { name: "answer",     type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "WiMsgGetConnectionInfo",
    definition: [
      { name: "qrId", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "WiMsgAnswer",
    definition: [
      { name: "answerType", type: DATA.TYPE_UINT8 },
      { name: "answer",     type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "WiMsgConnectionInfo",
    definition: []
  },
  {
    label: "WiMsgConnectionAccepted",
    definition: [
      { name: "qrId", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "WiMsgForwardedRequest",
    definition: [
      { name: "requestType", type: DATA.TYPE_UINT8 },
      { name: "request",     type: DATA.TYPE_BINARY }
    ]
  }
];

// client -> server
export const WIMSG_REQUEST             = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgRequest");

// server -> client
export const WIMSG_UPDATE_QR           = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgUpdateQr");
export const WIMSG_CONNECTION_TOKEN    = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgConnectionToken");
export const WIMSG_FORWARDED_ANSWER    = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgForwardedAnswer");

// wallet -> server
export const WIMSG_GET_CONNECTION_INFO = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgGetConnectionInfo");
export const WIMSG_ANSWER              = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgAnswer");

// server -> wallet
export const WIMSG_CONNECTION_INFO     = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgConnectionInfo");
export const WIMSG_CONNECTION_ACCEPTED = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgConnectionAccepted");
export const WIMSG_FORWARDED_REQUEST   = WI_MESSAGES.findIndex((s: Schema) => s.label == "WiMsgForwardedRequest");

export const WI_REQUESTS: Schema[] = [
  {
    label: "WiRqAuthByPublicKey",
    definition: [
      { name: "challenge", type: DATA.TYPE_BIN256 }
    ]
  },
  {
    label: "WiRqGetEmail",
    definition: []
  },
  {
    label: "WiRqGetUserData",
    definition: [
      { name: "requiredData", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
    ]
  },
  {
    label: "WiRqDataApproval",
    definition: [
      { name: "dataId", type: DATA.TYPE_BINARY },
      { name: "serverUrl", type: DATA.TYPE_STRING }
    ]
  }
];

export const WI_ANSWERS: Schema[] = [
  {
    label: "WiRqAuthByPublicKey",
    definition: [
      { name: "publicKey", type: DATA.TYPE_STRING },
      { name: "signature", type: DATA.TYPE_STRING }
    ]
  },
  {
    label: "WiRqGetEmail",
    definition: [
      { name: "email", type: DATA.TYPE_STRING }
    ]
  },
  {
    label: "WiRqDataApproval",
    definition: [
      { name: "vbHash", type: DATA.TYPE_BINARY },
      { name: "mbHash", type: DATA.TYPE_BINARY },
      { name: "height", type: DATA.TYPE_UINT48 }
    ]
  },
  {
    label: "WiRqGetUserData",
    definition: [
      { name: "userData", type: DATA.TYPE_ARRAY_OF | DATA.TYPE_STRING }
    ]
  }
];

export const WIRQ_AUTH_BY_PUBLIC_KEY = WI_REQUESTS.findIndex((s: Schema) => s.label == "WiRqAuthByPublicKey");
export const WIRQ_DATA_APPROVAL      = WI_REQUESTS.findIndex((s: Schema) => s.label == "WiRqDataApproval");
export const WIRQ_GET_EMAIL          = WI_REQUESTS.findIndex((s: Schema) => s.label == "WiRqGetEmail");
export const WIRQ_GET_USER_DATA      = WI_REQUESTS.findIndex((s: Schema) => s.label == "WiRqGetUserData");

// ============================================================================================================================ //
//  Wallet <-> operator network messages                                                                                        //
// ============================================================================================================================ //
export const WALLET_OP_MESSAGES: Schema[] = [
  {
    label: "MessageApprovalHandshake",
    definition: [
      { name: "dataId", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageActorKey",
    definition: [
      { name: "dataId",   type: DATA.TYPE_BINARY },
      { name: "actorKey", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageApprovalSignature",
    definition: [
      { name: "dataId",    type: DATA.TYPE_BINARY },
      { name: "signature", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageAnswerActorKeyRequired",
    definition: [
      { name: "genesisSeed", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageAnswerApprovalData",
    definition: [
      { name: "data", type: DATA.TYPE_BINARY }
    ]
  },
  {
    label: "MessageAnswerApprovalSignature",
    definition: [
      { name: "vbHash", type: DATA.TYPE_BINARY },
      { name: "mbHash", type: DATA.TYPE_BINARY },
      { name: "height", type: DATA.TYPE_NUMBER }
    ]
  },
  {
    label: "MessageAnswerError",
    definition: [
      { name: "error", type: DATA.TYPE_OBJECT, schema: ERROR }
    ]
  }
];

export const MSG_APPROVAL_HANDSHAKE     = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageApprovalHandshake");
export const MSG_ACTOR_KEY              = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageActorKey");
export const MSG_APPROVAL_SIGNATURE     = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageApprovalSignature");
export const MSG_ANS_ACTOR_KEY_REQUIRED = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageAnswerActorKeyRequired");
export const MSG_ANS_APPROVAL_DATA      = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageAnswerApprovalData");
export const MSG_ANS_APPROVAL_SIGNATURE = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageAnswerApprovalSignature");
export const MSG_ANS_ERROR              = WALLET_OP_MESSAGES.findIndex((o: Schema) => o.label == "MessageAnswerError");

// ============================================================================================================================ //
//  All schemas are summarized here for automated translation to interfaces                                                     //
// ============================================================================================================================ //
export const ALL_SCHEMAS = {
  singles: [
    RECORD_ACTOR,
    RECORD_CHANNEL,
    RECORD_CHANNEL_ASSIGNATION,
    RECORD_ACTOR_ASSIGNATION,
    RECORD_MASKED_PART,
    RECORD_MASKABLE_FIELD,
    RECORD_HASHABLE_FIELD,
    RECORD_DESCRIPTION,

    MICROBLOCK_HEADER,
    MICROBLOCK_SECTION,
    MICROBLOCK_BODY,
    MICROBLOCK_INFORMATION,

    WI_QR_CODE
  ],
  collections: [
    { label: "VbState", list: VB_STATES },
    { label: "NodeMessage", list: NODE_MESSAGES },
    { label: "WiMessage", list: WI_MESSAGES },
    { label: "WiRequest", list: WI_REQUESTS },
    { label: "WiAnswer", list: WI_ANSWERS },
    { label: "WalletOpMessage", list: WALLET_OP_MESSAGES }
  ]
};
