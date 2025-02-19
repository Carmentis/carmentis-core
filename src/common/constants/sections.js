import * as ID from "./id.js";
import * as DATA from "./data.js";
import * as SCHEMAS from "./schemas.js";

export const SIGNATURE_SECTION_SIZE = 69;

// ============================================================================================================================ //
//  Key types                                                                                                                   //
// ============================================================================================================================ //
export const KEY_ROOT        = 0x0000;
export const KEY_ACTOR       = 0x0100;
export const KEY_PAYER_PAYEE = 0x0200;
export const KEY_INVITATION  = 0x0300;
export const KEY_CHANNEL     = 0x0400;

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
export const ACCOUNT_TOKEN_ISSUANCE = 0;
export const ACCOUNT_CREATION       = 1;
export const ACCOUNT_TRANSFER       = 2;
export const ACCOUNT_SIGNATURE      = 3;

export const ACCOUNT_STRUCTURE = new RegExp(
  `^(<${ACCOUNT_TOKEN_ISSUANCE}>|<${ACCOUNT_CREATION}>|<${ACCOUNT_TRANSFER}>+)<${ACCOUNT_SIGNATURE}>$`
);

// TODO: staking, slashing, frozen tokens, burn

const ACCOUNT = {
  [ ACCOUNT_TOKEN_ISSUANCE ]: {
    label: "ACCOUNT_TOKEN_ISSUANCE",
    fields: [
      { name: "issuerPublicKey", type: DATA.PUB_KEY },
      { name: "amount",          type: DATA.UINT48 }
    ]
  },
  [ ACCOUNT_CREATION ]: {
    label: "ACCOUNT_CREATION",
    fields: [
      { name: "sellerAccount",  type: DATA.HASH },
      { name: "buyerPublicKey", type: DATA.PUB_KEY },
      { name: "amount",         type: DATA.UINT48 }
    ]
  },
  [ ACCOUNT_TRANSFER ]: {
    label: "ACCOUNT_TRANSFER",
    fields: [
      { name: "account",          type: DATA.HASH },
      { name: "amount",           type: DATA.UINT48 },
      { name: "publicReference",  type: DATA.STRING | DATA.OPTIONAL },
      { name: "privateReference", type: DATA.STRING | DATA.PRIVATE | DATA.OPTIONAL }
    ],
    subsections: [
      {
        rule : "privateReference",
        type : DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES,
        keyId: KEY_PAYER_PAYEE
      }
    ]
  },
  [ ACCOUNT_SIGNATURE ]: {
    label: "ACCOUNT_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  Node                                                                                                                        //
// ============================================================================================================================ //
export const NODE_DECLARATION = 0;
export const NODE_SIGNATURE   = 1;

export const NODE_STRUCTURE = new RegExp(
  `^(<${NODE_DECLARATION}>)<${NODE_SIGNATURE}>$`
);

const VALIDATOR_NODE = {
  [ NODE_DECLARATION ]: {
    label: "NODE_CREATION",
    fields: [
      { name: "organizationId", type: DATA.HASH }
    ]
  },
  [ NODE_SIGNATURE ]: {
    label: "NODE_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_PUBLIC_KEY  = 0;
export const ORG_DESCRIPTION = 1;
export const ORG_SERVER      = 2;
export const ORG_SIGNATURE   = 3;

export const ORG_STRUCTURE = new RegExp(
  `^(<${ORG_PUBLIC_KEY}>|<${ORG_DESCRIPTION}>|<${ORG_SERVER}>)+<${ORG_SIGNATURE}>$`
);

// TODO: PayForMe / Gas station

const ORGANIZATION = {
  [ ORG_PUBLIC_KEY ]: {
    label: "ORG_PUBLIC_KEY",
    fields: [
      { name: "publicKey", type: DATA.PUB_KEY }
    ]
  },
  [ ORG_DESCRIPTION ]: {
    label: "ORG_DESCRIPTION",
    fields: [
      { name: "name",        type: DATA.STRING },
      { name: "city",        type: DATA.STRING },
      { name: "countryCode", type: DATA.STRING, size: 2 },
      { name: "website",     type: DATA.STRING }
    ]
  },
  [ ORG_SERVER ] : {
    label: "ORG_SERVER",
    fields: [
      { name: "endpoint", type: DATA.STRING }
    ]
  },
  [ ORG_SIGNATURE ]: {
    label: "ORG_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //
export const APP_DECLARATION = 0;
export const APP_DESCRIPTION = 1;
export const APP_DEFINITION  = 2;
export const APP_SIGNATURE   = 3;

export const APP_STRUCTURE = new RegExp(
  `^(<${APP_DECLARATION}>|<${APP_DESCRIPTION}>|<${APP_DEFINITION}>)+<${APP_SIGNATURE}>$`
);

const APPLICATION = {
  [ APP_DECLARATION ]: {
    label: "APP_DECLARATION",
    fields: [
      { name: "organizationId", type: DATA.HASH }
    ]
  },
  [ APP_DESCRIPTION ]: {
    label: "APP_DESCRIPTION",
    fields: [
      { name: "name",        type: DATA.STRING },
      { name: "logoUrl",     type: DATA.STRING },
      { name: "homepageUrl", type: DATA.STRING },
      { name: "rootDomain",  type: DATA.STRING },
      { name: "description", type: DATA.STRING }
    ]
  },
  [ APP_DEFINITION ]: {
    label: "APP_DEFINITION",
    fields: [
      { name: "version",    type: DATA.UINT16 },
      { name: "definition", type: DATA.OBJECT, schema: SCHEMAS.APPLICATION_DEFINITION }
    ]
  },
  [ APP_SIGNATURE ]: {
    label: "APP_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  Application user                                                                                                            //
// ============================================================================================================================ //
const APP_USER = {
};

// ============================================================================================================================ //
//  App ledger                                                                                                                  //
// ============================================================================================================================ //
export const APP_LEDGER_DECLARATION        = 0;
export const APP_LEDGER_VERSION_UPDATE     = 1;
export const APP_LEDGER_ACTOR_CREATION     = 2;
export const APP_LEDGER_CHANNEL_CREATION   = 3;
export const APP_LEDGER_CHANNEL_INVITATION = 4;
export const APP_LEDGER_ACTOR_SUBSCRIPTION = 5;
export const APP_LEDGER_CHANNEL_DATA       = 6 | DATA.EXTERNAL_SCHEMA;
export const APP_LEDGER_ORACLE_DATA        = 7;
export const APP_LEDGER_AUTHOR             = 8;
export const APP_LEDGER_ENDORSER           = 9;
export const APP_LEDGER_ENDORSER_SIGNATURE = 10;
export const APP_LEDGER_AUTHOR_SIGNATURE   = 11;

export const APP_LEDGER_STRUCTURE = new RegExp(
  `^(<${APP_LEDGER_DECLARATION}>|<${APP_LEDGER_VERSION_UPDATE}>|<${APP_LEDGER_ACTOR_CREATION}>|<${APP_LEDGER_CHANNEL_CREATION}>|<${APP_LEDGER_CHANNEL_INVITATION}>|<${APP_LEDGER_ACTOR_SUBSCRIPTION}>|<${APP_LEDGER_CHANNEL_DATA}>|<${APP_LEDGER_ORACLE_DATA}>|<${APP_LEDGER_AUTHOR}>|<${APP_LEDGER_ENDORSER}>)+(<${APP_LEDGER_ENDORSER_SIGNATURE}>)?<${APP_LEDGER_AUTHOR_SIGNATURE}>$`
);

const APP_LEDGER = {
  [ APP_LEDGER_DECLARATION ]: {
    label: "APP_LEDGER_DECLARATION",
    fields: [
      { name: "applicationId", type: DATA.HASH },
      { name: "version",       type: DATA.UINT16 }
    ]
  },
  [ APP_LEDGER_VERSION_UPDATE ]: {
    label: "APP_LEDGER_VERSION_UPDATE",
    fields: [
      { name: "version", type: DATA.UINT16 }
    ]
  },
  [ APP_LEDGER_ACTOR_CREATION ]: {
    label: "APP_LEDGER_ACTOR_CREATION",
    fields: [
      { name: "id",   type: DATA.UINT8 },
      { name: "type", type: DATA.UINT8 },
      { name: "name", type: DATA.STRING }
    ]
  },
  [ APP_LEDGER_CHANNEL_CREATION ]: {
    label: "APP_LEDGER_CHANNEL_CREATION",
    fields: [
      { name: "id",         type: DATA.UINT8 },
      { name: "keyOwnerId", type: DATA.UINT8 },
      { name: "name",       type: DATA.STRING }
    ]
  },
  [ APP_LEDGER_CHANNEL_INVITATION ]: {
    label: "APP_LEDGER_CHANNEL_INVITATION",
    fields: [
      { name: "channelId",  type: DATA.UINT8 },
      { name: "hostId",     type: DATA.UINT8 },
      { name: "guestId",    type: DATA.UINT8 },
      { name: "channelKey", type: DATA.AES_KEY | DATA.PRIVATE }
    ],
    subsections: [
      {
        rule : "channelKey",
        type : DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES,
        keyId: KEY_INVITATION
      }
    ]
  },
  [ APP_LEDGER_ACTOR_SUBSCRIPTION ]: {
    label: "APP_LEDGER_ACTOR_SUBSCRIPTION",
    fields: [
      { name: "actorId",        type: DATA.UINT8 },
      { name: "actorType",      type: DATA.UINT8 },
      { name: "organizationId", type: DATA.UINT8, condition: parent => parent.actorType == DATA.ACTOR_ORGANIZATION },
      { name: "publicKey",      type: DATA.PUB_KEY, condition: parent => parent.actorType == DATA.ACTOR_END_USER }
    ]
  },
  [ APP_LEDGER_CHANNEL_DATA ]: {
    label: "APP_LEDGER_CHANNEL_DATA"
  },
  [ APP_LEDGER_ORACLE_DATA ]: {
    label: "APP_LEDGER_ORACLE_DATA",
    fields: [
    ]
  },
  [ APP_LEDGER_AUTHOR ]: {
    label: "APP_LEDGER_AUTHOR",
    fields: [
      { name: "authorId", type: DATA.UINT8 }
    ]
  },
  [ APP_LEDGER_ENDORSER ]: {
    label: "APP_LEDGER_ENDORSER",
    fields: [
      { name: "endorserId", type: DATA.UINT8 },
      { name: "messageId",  type: DATA.UINT16 }
    ]
  },
  [ APP_LEDGER_ENDORSER_SIGNATURE ]: {
    label: "APP_LEDGER_ENDORSER_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  },
  [ APP_LEDGER_AUTHOR_SIGNATURE ]: {
    label: "APP_LEDGER_AUTHOR_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  Oracle                                                                                                                      //
// ============================================================================================================================ //
export const ORACLE_DECLARATION = 0;
export const ORACLE_DESCRIPTION = 1;
export const ORACLE_DEFINITION  = 2;
export const ORACLE_SIGNATURE   = 3;

export const ORACLE_STRUCTURE = new RegExp(
  `^(<${ORACLE_DECLARATION}>|<${ORACLE_DESCRIPTION}>|<${ORACLE_DEFINITION}>)+<${ORACLE_SIGNATURE}>$`
);

const ORACLE = {
  [ ORACLE_DECLARATION ]: {
    label: "ORACLE_DECLARATION",
    fields: [
      { name: "organizationId", type: DATA.HASH }
    ]
  },
  [ ORACLE_DESCRIPTION ]: {
    label: "ORACLE_DESCRIPTION",
    fields: [
      { name: "name", type: DATA.STRING }
    ]
  },
  [ ORACLE_DEFINITION ]: {
    label: "ORACLE_DEFINITION",
    fields: [
      { name: "version",    type: DATA.UINT16 },
      { name: "definition", type: DATA.OBJECT, schema: SCHEMAS.ORACLE_DEFINITION }
    ]
  },
  [ ORACLE_SIGNATURE ]: {
    label: "ORACLE_SIGNATURE",
    fields: [
      { name: "signature", type: DATA.SIGNATURE }
    ]
  }
};

// ============================================================================================================================ //
//  All sections                                                                                                                //
// ============================================================================================================================ //
export const DEF = {
  [ ID.OBJ_ACCOUNT        ]: ACCOUNT,
  [ ID.OBJ_VALIDATOR_NODE ]: VALIDATOR_NODE,
  [ ID.OBJ_ORGANIZATION   ]: ORGANIZATION,
  [ ID.OBJ_APPLICATION    ]: APPLICATION,
  [ ID.OBJ_APP_USER       ]: APP_USER,
  [ ID.OBJ_APP_LEDGER     ]: APP_LEDGER,
  [ ID.OBJ_ORACLE         ]: ORACLE
};
