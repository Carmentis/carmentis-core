import * as DATA from "./data";
import * as CHAIN from "./chain";
import {Schema} from "./schemas";

// ============================================================================================================================ //
//  Constraints                                                                                                                 //
// ============================================================================================================================ //
export const ZERO         = 0;
export const ONE          = 1;
export const AT_LEAST_ONE = 2;
export const AT_MOST_ONE  = 3;
export const ANY          = 4;

export const CONSTRAINT_NAMES = [
  "no sections",
  "exactly one section",
  "at least one section",
  "at most one section",
  "any number of sections"
];

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
export const ACCOUNT_SIG_ALGORITHM  = 0;
export const ACCOUNT_PUBLIC_KEY     = 1;
export const ACCOUNT_TOKEN_ISSUANCE = 2;
export const ACCOUNT_CREATION       = 3;
export const ACCOUNT_TRANSFER       = 4;
export const ACCOUNT_SIGNATURE      = 5;

const ACCOUNT: Schema[] = [] as const;

ACCOUNT[ACCOUNT_SIG_ALGORITHM] = {
  label: "ACCOUNT_SIG_ALGORITHM",
  definition: [
    { name: "algorithmId", type: DATA.TYPE_UINT8 }
  ]
};

ACCOUNT[ACCOUNT_PUBLIC_KEY] = {
  label: "ACCOUNT_PUBLIC_KEY",
  definition: [
    { name: "publicKey", type: DATA.TYPE_BINARY }
  ]
};

ACCOUNT[ACCOUNT_TOKEN_ISSUANCE] = {
  label: "ACCOUNT_TOKEN_ISSUANCE",
  definition: [
    { name: "amount", type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_CREATION] = {
  label: "ACCOUNT_CREATION",
  definition: [
    { name: "sellerAccount", type: DATA.TYPE_BIN256 },
    { name: "amount",        type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_TRANSFER] = {
  label: "ACCOUNT_TRANSFER",
  definition: [
    { name: "account",          type: DATA.TYPE_BIN256 },
    { name: "amount",           type: DATA.TYPE_UINT48 },
    { name: "publicReference",  type: DATA.TYPE_STRING },
    { name: "privateReference", type: DATA.TYPE_STRING }
  ]
};

ACCOUNT[ACCOUNT_SIGNATURE] = {
  label: "ACCOUNT_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Validator node                                                                                                              //
// ============================================================================================================================ //
export const VN_SIG_ALGORITHM = 0;
export const VN_DECLARATION   = 1;
export const VN_DESCRIPTION   = 2;
export const VN_SIGNATURE     = 3;

const VALIDATOR_NODE: Schema[] = [] as const;

VALIDATOR_NODE[VN_SIG_ALGORITHM] = {
  label: "VN_SIG_ALGORITHM",
  definition: [
    { name: "algorithmId", type: DATA.TYPE_UINT8 }
  ]
};

VALIDATOR_NODE[VN_DECLARATION] = {
  label: "VN_DECLARATION",
  definition: [
    { name: "organizationId", type: DATA.TYPE_BIN256 }
  ]
};

VALIDATOR_NODE[VN_DESCRIPTION] = {
  label: "VN_DESCRIPTION",
  definition: [
    { name: "cometPublicKeyType", type: DATA.TYPE_STRING },
    { name: "cometPublicKey",     type: DATA.TYPE_STRING },
    { name: "power",              type: DATA.TYPE_UINT48 }
  ]
};

VALIDATOR_NODE[VN_SIGNATURE] = {
  label: "VN_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_SIG_ALGORITHM = 0;
export const ORG_PUBLIC_KEY    = 1;
export const ORG_DESCRIPTION   = 2;
export const ORG_SERVER        = 3;
export const ORG_SIGNATURE     = 4;

const ORGANIZATION: Schema[] = [] as const;

ORGANIZATION[ORG_SIG_ALGORITHM] = {
  label: "ORG_SIG_ALGORITHM",
  definition: [
    { name: "algorithmId", type: DATA.TYPE_UINT8 }
  ]
};

ORGANIZATION[ORG_PUBLIC_KEY] = {
  label: "ORG_PUBLIC_KEY",
  definition: [
    { name: "publicKey", type: DATA.TYPE_BINARY }
  ]
};

ORGANIZATION[ORG_DESCRIPTION] = {
  label: "ORG_DESCRIPTION",
  definition: [
    { name: "name",        type: DATA.TYPE_STRING },
    { name: "city",        type: DATA.TYPE_STRING },
    { name: "countryCode", type: DATA.TYPE_STRING, size: 2 },
    { name: "website",     type: DATA.TYPE_STRING }
  ]
};

ORGANIZATION[ORG_SERVER] = {
  label: "ORG_SERVER",
  definition: [
    { name: "endpoint", type: DATA.TYPE_STRING }
  ]
};

ORGANIZATION[ORG_SIGNATURE] = {
  label: "ORG_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //
export const APP_SIG_ALGORITHM = 0;
export const APP_DECLARATION   = 1;
export const APP_DESCRIPTION   = 2;
export const APP_SIGNATURE     = 3;

const APPLICATION: Schema[] = [] as const;

APPLICATION[APP_SIG_ALGORITHM] = {
  label: "APP_SIG_ALGORITHM",
  definition: [
    { name: "algorithmId", type: DATA.TYPE_UINT8 }
  ]
};

APPLICATION[APP_DECLARATION] = {
  label: "APP_DECLARATION",
  definition: [
    { name: "organizationId", type: DATA.TYPE_BIN256 }
  ]
};

APPLICATION[APP_DESCRIPTION] = {
  label: "APP_DESCRIPTION",
  definition: [
    { name: "name",        type: DATA.TYPE_STRING },
    { name: "logoUrl",     type: DATA.TYPE_STRING },
    { name: "homepageUrl", type: DATA.TYPE_STRING },
    { name: "description", type: DATA.TYPE_STRING }
  ]
};

APPLICATION[APP_SIGNATURE] = {
  label: "APP_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Application ledger                                                                                                          //
// ============================================================================================================================ //
export const APP_LEDGER_SIG_ALGORITHM        = 0;
export const APP_LEDGER_DECLARATION          = 1;
export const APP_LEDGER_ACTOR_CREATION       = 2;
export const APP_LEDGER_CHANNEL_CREATION     = 3;
export const APP_LEDGER_SHARED_SECRET        = 4;
export const APP_LEDGER_CHANNEL_INVITATION   = 5;
export const APP_LEDGER_ACTOR_SUBSCRIPTION   = 6;
export const APP_LEDGER_PUBLIC_CHANNEL_DATA  = 7;
export const APP_LEDGER_PRIVATE_CHANNEL_DATA = 8;
export const APP_LEDGER_AUTHOR               = 9;
export const APP_LEDGER_ENDORSER             = 10;
export const APP_LEDGER_ENDORSER_SIGNATURE   = 11;
export const APP_LEDGER_AUTHOR_SIGNATURE     = 12;

const APP_LEDGER: Schema[] = [] as const;

APP_LEDGER[APP_LEDGER_SIG_ALGORITHM] = {
  label: "APP_LEDGER_SIG_ALGORITHM",
  definition: [
    { name: "algorithmId", type: DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_DECLARATION] = {
  label: "APP_LEDGER_DECLARATION",
  definition: [
    { name: "applicationId", type: DATA.TYPE_BIN256 }
  ]
};

APP_LEDGER[APP_LEDGER_ACTOR_CREATION] = {
  label: "APP_LEDGER_ACTOR_CREATION",
  definition: [
    { name: "id",   type: DATA.TYPE_UINT8 },
    { name: "type", type: DATA.TYPE_UINT8 },
    { name: "name", type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_CREATION] = {
  label: "APP_LEDGER_CHANNEL_CREATION",
  definition: [
    { name: "id",        type: DATA.TYPE_UINT8 },
    { name: "isPrivate", type: DATA.TYPE_BOOLEAN },
    { name: "creatorId", type: DATA.TYPE_UINT8 },
    { name: "name",      type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_SHARED_SECRET] = {
  label: "APP_LEDGER_SHARED_SECRET",
  definition: [
    { name: "hostId",        type: DATA.TYPE_UINT8 },
    { name: "guestId",       type: DATA.TYPE_UINT8 },
    { name: "encapsulation", type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_INVITATION] = {
  label: "APP_LEDGER_CHANNEL_INVITATION",
  definition: [
    { name: "channelId",  type: DATA.TYPE_UINT8 },
    { name: "hostId",     type: DATA.TYPE_UINT8 },
    { name: "guestId",    type: DATA.TYPE_UINT8 },
    { name: "channelKey", type: DATA.TYPE_BINARY }
  ]};

APP_LEDGER[APP_LEDGER_ACTOR_SUBSCRIPTION] = {
  label: "APP_LEDGER_ACTOR_SUBSCRIPTION",
  definition: [
    { name: "actorId",            type: DATA.TYPE_UINT8 },
    { name: "actorType",          type: DATA.TYPE_UINT8 },
    { name: "organizationId",     type: DATA.TYPE_BIN256 },
    { name: "kemPublicKey",       type: DATA.TYPE_BINARY },
    { name: "signaturePublicKey", type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PUBLIC_CHANNEL_DATA] = {
  label: "APP_LEDGER_PUBLIC_CHANNEL_DATA",
  definition: [
    { name: "channelId", type: DATA.TYPE_UINT8 },
    { name: "data",      type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PRIVATE_CHANNEL_DATA] = {
  label: "APP_LEDGER_PRIVATE_CHANNEL_DATA",
  definition: [
    { name: "channelId",      type: DATA.TYPE_UINT8 },
    { name: "merkleRootHash", type: DATA.TYPE_BIN256 },
    { name: "encryptedData",  type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_AUTHOR] = {
  label: "APP_LEDGER_AUTHOR",
  definition: [
    { name: "authorId", type: DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_ENDORSER] = {
  label: "APP_LEDGER_ENDORSER",
  definition: [
    { name: "endorserId", type: DATA.TYPE_UINT8 },
    { name: "messageId",  type: DATA.TYPE_UINT16 }
  ]
};

APP_LEDGER[APP_LEDGER_ENDORSER_SIGNATURE] = {
  label: "APP_LEDGER_ENDORSER_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_AUTHOR_SIGNATURE] = {
  label: "APP_LEDGER_AUTHOR_SIGNATURE",
  definition: [
    { name: "signature", type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  All sections                                                                                                                //
// ============================================================================================================================ //
export const DEF: Schema[][] = [
  ACCOUNT,
  VALIDATOR_NODE,
  ORGANIZATION,
  APPLICATION,
  APP_LEDGER
];
