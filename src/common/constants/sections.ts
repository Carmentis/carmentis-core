import * as DATA from "./data";
import * as CHAIN from "./chain";
import {Schema} from "./schemas";
import {z} from 'zod';
import {SectionType} from "../entities/SectionType";

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
export const ACCOUNT_SIG_ALGORITHM  = SectionType.ACCOUNT_SIG_ALGORITHM;
export const ACCOUNT_PUBLIC_KEY     = SectionType.ACCOUNT_PUBLIC_KEY;
export const ACCOUNT_TOKEN_ISSUANCE = SectionType.ACCOUNT_TOKEN_ISSUANCE;
export const ACCOUNT_CREATION       = SectionType.ACCOUNT_CREATION;
export const ACCOUNT_TRANSFER       = SectionType.ACCOUNT_TRANSFER;
export const ACCOUNT_SIGNATURE      = SectionType.ACCOUNT_SIGNATURE;

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
const VALIDATOR_NODE: Schema[] = [] as const;

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_SIG_ALGORITHM = SectionType.ORG_SIG_ALGORITHM;
export const ORG_PUBLIC_KEY    = SectionType.ORG_PUBLIC_KEY;
export const ORG_DESCRIPTION   = SectionType.ORG_DESCRIPTION;
export const ORG_SERVER        = SectionType.ORG_SERVER;
export const ORG_SIGNATURE     = SectionType.ORG_SIGNATURE;

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
export const APP_SIG_ALGORITHM = SectionType.APP_SIG_ALGORITHM;
export const APP_DECLARATION   = SectionType.APP_DECLARATION;
export const APP_DESCRIPTION   = SectionType.APP_DESCRIPTION;
export const APP_SIGNATURE     = SectionType.APP_SIGNATURE;

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
export const APP_LEDGER_SIG_ALGORITHM        = SectionType.APP_LEDGER_SIG_ALGORITHM;
export const APP_LEDGER_DECLARATION          = SectionType.APP_LEDGER_DECLARATION;
export const APP_LEDGER_ACTOR_CREATION       = SectionType.APP_LEDGER_ACTOR_CREATION;
export const APP_LEDGER_CHANNEL_CREATION     = SectionType.APP_LEDGER_CHANNEL_CREATION;
export const APP_LEDGER_SHARED_SECRET        = SectionType.APP_LEDGER_SHARED_SECRET;
export const APP_LEDGER_CHANNEL_INVITATION   = SectionType.APP_LEDGER_CHANNEL_INVITATION;
export const APP_LEDGER_ACTOR_SUBSCRIPTION   = SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION;
export const APP_LEDGER_PUBLIC_CHANNEL_DATA  = SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA;
export const APP_LEDGER_PRIVATE_CHANNEL_DATA = SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA;
export const APP_LEDGER_AUTHOR               = SectionType.APP_LEDGER_AUTHOR;
export const APP_LEDGER_ENDORSER             = SectionType.APP_LEDGER_ENDORSER;
export const APP_LEDGER_ENDORSER_SIGNATURE   = SectionType.APP_LEDGER_ENDORSER_SIGNATURE;
export const APP_LEDGER_AUTHOR_SIGNATURE     = SectionType.APP_LEDGER_AUTHOR_SIGNATURE;

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
  ]
};

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



export const ALL_SECTIONS_SCHEMAS = {
  ...ORGANIZATION,
  ...APPLICATION,
  ...ACCOUNT,
  ...VALIDATOR_NODE,
  ...APP_LEDGER,
}

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
