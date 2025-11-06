import * as DATA from './data';
import * as CHAIN from './chain';
import {Schema, CONTRACT_SCHEMA} from './schemas';
import {SectionType} from '../entities/SectionType';

// ============================================================================================================================ //
//  Constraints                                                                                                                 //
// ============================================================================================================================ //
export const ZERO         = 0;
export const ONE          = 1;
export const AT_LEAST_ONE = 2;
export const AT_MOST_ONE  = 3;
export const ANY          = 4;

export const CONSTRAINT_NAMES = [
  'no sections',
  'exactly one section',
  'at least one section',
  'at most one section',
  'any number of sections'
];

// ============================================================================================================================ //
//  Protocol                                                                                                                    //
// ============================================================================================================================ //
export const PROTOCOL_SIG_SCHEME      = SectionType.PROTOCOL_SIG_SCHEME;
export const PROTOCOL_PUBLIC_KEY      = SectionType.PROTOCOL_PUBLIC_KEY;
export const PROTOCOL_PROTOCOL_UPDATE = SectionType.PROTOCOL_PROTOCOL_UPDATE;
export const PROTOCOL_NODE_UPDATE     = SectionType.PROTOCOL_NODE_UPDATE;
export const PROTOCOL_SIGNATURE       = SectionType.PROTOCOL_SIGNATURE;

const PROTOCOL: Schema[] = [] as const;

PROTOCOL[PROTOCOL_SIG_SCHEME] = {
  label: 'PROTOCOL_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

PROTOCOL[PROTOCOL_PUBLIC_KEY] = {
  label: 'PROTOCOL_PUBLIC_KEY',
  definition: [
    { name: 'publicKey', type: DATA.TYPE_BINARY }
  ]
};

PROTOCOL[PROTOCOL_PROTOCOL_UPDATE] = {
  label: 'PROTOCOL_PROTOCOL_UPDATE',
  definition: [
    { name: 'effectiveUtcTimestamp', type: DATA.TYPE_UINT48 },
    { name: 'version',               type: DATA.TYPE_UINT16 },
    { name: 'codeName',              type: DATA.TYPE_STRING },
    { name: 'changeLog',             type: DATA.TYPE_STRING },
    { name: 'contracts',             type: DATA.TYPE_ARRAY_OF | DATA.TYPE_OBJECT, schema: CONTRACT_SCHEMA }
  ]
};

PROTOCOL[PROTOCOL_NODE_UPDATE] = {
  label: 'PROTOCOL_NODE_UPDATE',
  definition: [
    { name: 'organizationId',     type: DATA.TYPE_BIN256 },
    { name: 'version',            type: DATA.TYPE_STRING },
    { name: 'maxProtocolVersion', type: DATA.TYPE_UINT16 },
    { name: 'changeLog',          type: DATA.TYPE_STRING },
    { name: 'url',                type: DATA.TYPE_STRING }
  ]
};

PROTOCOL[PROTOCOL_SIGNATURE] = {
  label: 'PROTOCOL_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
export const ACCOUNT_SIG_SCHEME       = SectionType.ACCOUNT_SIG_SCHEME;
export const ACCOUNT_PUBLIC_KEY       = SectionType.ACCOUNT_PUBLIC_KEY;
export const ACCOUNT_TOKEN_ISSUANCE   = SectionType.ACCOUNT_TOKEN_ISSUANCE;
export const ACCOUNT_CREATION         = SectionType.ACCOUNT_CREATION;
export const ACCOUNT_TRANSFER         = SectionType.ACCOUNT_TRANSFER;
export const ACCOUNT_VESTING_TRANSFER = SectionType.ACCOUNT_VESTING_TRANSFER;
export const ACCOUNT_ESCROW_TRANSFER  = SectionType.ACCOUNT_ESCROW_TRANSFER;
export const ACCOUNT_STAKE            = SectionType.ACCOUNT_STAKE;
export const ACCOUNT_SIGNATURE        = SectionType.ACCOUNT_SIGNATURE;

const ACCOUNT: Schema[] = [] as const;

ACCOUNT[ACCOUNT_SIG_SCHEME] = {
  label: 'ACCOUNT_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

ACCOUNT[ACCOUNT_PUBLIC_KEY] = {
  label: 'ACCOUNT_PUBLIC_KEY',
  definition: [
    { name: 'publicKey', type: DATA.TYPE_BINARY }
  ]
};

ACCOUNT[ACCOUNT_TOKEN_ISSUANCE] = {
  label: 'ACCOUNT_TOKEN_ISSUANCE',
  definition: [
    { name: 'amount', type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_CREATION] = {
  label: 'ACCOUNT_CREATION',
  definition: [
    { name: 'sellerAccount', type: DATA.TYPE_BIN256 },
    { name: 'amount',        type: DATA.TYPE_UINT48 }
  ]
};

ACCOUNT[ACCOUNT_TRANSFER] = {
  label: 'ACCOUNT_TRANSFER',
  definition: [
    { name: 'account',          type: DATA.TYPE_BIN256 },
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'publicReference',  type: DATA.TYPE_STRING },
    { name: 'privateReference', type: DATA.TYPE_STRING }
  ]
};

ACCOUNT[ACCOUNT_VESTING_TRANSFER] = {
  label: 'ACCOUNT_VESTING_TRANSFER',
  definition: [
    { name: 'account',          type: DATA.TYPE_BIN256 },
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'publicReference',  type: DATA.TYPE_STRING },
    { name: 'privateReference', type: DATA.TYPE_STRING },
    { name: 'cliffPeriod',      type: DATA.TYPE_UINT16 },
    { name: 'vestingPeriod',    type: DATA.TYPE_UINT16 }
  ]
};

ACCOUNT[ACCOUNT_ESCROW_TRANSFER] = {
  label: 'ACCOUNT_ESCROW_TRANSFER',
  definition: [
    { name: 'account',          type: DATA.TYPE_BIN256 },
    { name: 'amount',           type: DATA.TYPE_UINT48 },
    { name: 'publicReference',  type: DATA.TYPE_STRING },
    { name: 'privateReference', type: DATA.TYPE_STRING },
    { name: 'agentPublicKey',   type: DATA.TYPE_BINARY }
  ]
};

ACCOUNT[ACCOUNT_STAKE] = {
  label: 'ACCOUNT_STAKE',
  definition: [
    { name: 'amount',         type: DATA.TYPE_UINT48 },
    { name: 'nodeIdentifier', type: DATA.TYPE_BIN256 }
  ]
};

ACCOUNT[ACCOUNT_SIGNATURE] = {
  label: 'ACCOUNT_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Validator node                                                                                                              //
// ============================================================================================================================ //
export const VN_SIG_SCHEME          = SectionType.VN_SIG_SCHEME;
export const VN_DECLARATION         = SectionType.VN_DECLARATION;
export const VN_DESCRIPTION         = SectionType.VN_DESCRIPTION;
export const VN_RPC_ENDPOINT        = SectionType.VN_RPC_ENDPOINT;
export const VN_NETWORK_INTEGRATION = SectionType.VN_NETWORK_INTEGRATION;
export const VN_SIGNATURE           = SectionType.VN_SIGNATURE;

const VALIDATOR_NODE: Schema[] = [] as const;

VALIDATOR_NODE[VN_SIG_SCHEME] = {
  label: 'VN_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

VALIDATOR_NODE[VN_DECLARATION] = {
  label: 'VN_DECLARATION',
  definition: [
    { name: 'organizationId', type: DATA.TYPE_BIN256 }
  ]
};

VALIDATOR_NODE[VN_DESCRIPTION] = {
  label: 'VN_DESCRIPTION',
  definition: [
    { name: 'cometPublicKeyType', type: DATA.TYPE_STRING },
    { name: 'cometPublicKey',     type: DATA.TYPE_STRING }
  ]
};

VALIDATOR_NODE[VN_RPC_ENDPOINT] = {
  label: 'VN_RPC_ENDPOINT',
  definition: [
    { name: 'rpcEndpoint', type: DATA.TYPE_STRING }
  ]
};

VALIDATOR_NODE[VN_NETWORK_INTEGRATION] = {
  label: 'VN_NETWORK_INTEGRATION',
  definition: [
    { name: 'votingPower', type: DATA.TYPE_UINT48 }
  ]
};

VALIDATOR_NODE[VN_SIGNATURE] = {
  label: 'VN_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_SIG_SCHEME    = SectionType.ORG_SIG_SCHEME;
export const ORG_PUBLIC_KEY    = SectionType.ORG_PUBLIC_KEY;
export const ORG_DESCRIPTION   = SectionType.ORG_DESCRIPTION;
export const ORG_SERVER        = SectionType.ORG_SERVER;
export const ORG_SIGNATURE     = SectionType.ORG_SIGNATURE;

const ORGANIZATION: Schema[] = [] as const;

ORGANIZATION[ORG_SIG_SCHEME] = {
  label: 'ORG_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

ORGANIZATION[ORG_PUBLIC_KEY] = {
  label: 'ORG_PUBLIC_KEY',
  definition: [
    { name: 'publicKey', type: DATA.TYPE_BINARY }
  ]
};

ORGANIZATION[ORG_DESCRIPTION] = {
  label: 'ORG_DESCRIPTION',
  definition: [
    { name: 'name',        type: DATA.TYPE_STRING },
    { name: 'city',        type: DATA.TYPE_STRING },
    { name: 'countryCode', type: DATA.TYPE_STRING, size: 2 },
    { name: 'website',     type: DATA.TYPE_STRING }
  ]
};

ORGANIZATION[ORG_SERVER] = {
  label: 'ORG_SERVER',
  definition: [
    { name: 'endpoint', type: DATA.TYPE_STRING }
  ]
};

ORGANIZATION[ORG_SIGNATURE] = {
  label: 'ORG_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //
export const APP_SIG_SCHEME  = SectionType.APP_SIG_SCHEME;
export const APP_DECLARATION = SectionType.APP_DECLARATION;
export const APP_DESCRIPTION = SectionType.APP_DESCRIPTION;
export const APP_SIGNATURE   = SectionType.APP_SIGNATURE;

const APPLICATION: Schema[] = [] as const;

APPLICATION[APP_SIG_SCHEME] = {
  label: 'APP_SIG_SCHEME',
  definition: [
    { name: 'schemeId', type: DATA.TYPE_UINT8 }
  ]
};

APPLICATION[APP_DECLARATION] = {
  label: 'APP_DECLARATION',
  definition: [
    { name: 'organizationId', type: DATA.TYPE_BIN256 }
  ]
};

APPLICATION[APP_DESCRIPTION] = {
  label: 'APP_DESCRIPTION',
  definition: [
    { name: 'name',        type: DATA.TYPE_STRING },
    { name: 'logoUrl',     type: DATA.TYPE_STRING },
    { name: 'homepageUrl', type: DATA.TYPE_STRING },
    { name: 'description', type: DATA.TYPE_STRING }
  ]
};

APPLICATION[APP_SIGNATURE] = {
  label: 'APP_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

// ============================================================================================================================ //
//  Application ledger                                                                                                          //
// ============================================================================================================================ //
export const APP_LEDGER_ALLOWED_SIG_SCHEMES  = SectionType.APP_LEDGER_ALLOWED_SIG_SCHEMES;
export const APP_LEDGER_ALLOWED_PKE_SCHEMES  = SectionType.APP_LEDGER_ALLOWED_PKE_SCHEMES;
export const APP_LEDGER_DECLARATION          = SectionType.APP_LEDGER_DECLARATION;
export const APP_LEDGER_ACTOR_CREATION       = SectionType.APP_LEDGER_ACTOR_CREATION;
export const APP_LEDGER_CHANNEL_CREATION     = SectionType.APP_LEDGER_CHANNEL_CREATION;
export const APP_LEDGER_SHARED_SECRET        = SectionType.APP_LEDGER_SHARED_SECRET;
export const APP_LEDGER_CHANNEL_INVITATION   = SectionType.APP_LEDGER_CHANNEL_INVITATION;
export const APP_LEDGER_ACTOR_SUBSCRIPTION   = SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION;
export const APP_LEDGER_PUBLIC_CHANNEL_DATA  = SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA;
export const APP_LEDGER_PRIVATE_CHANNEL_DATA = SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA;
export const APP_LEDGER_AUTHOR               = SectionType.APP_LEDGER_AUTHOR;
export const APP_LEDGER_ENDORSEMENT_REQUEST             = SectionType.APP_LEDGER_ENDORSEMENT_REQUEST;
export const APP_LEDGER_ENDORSER_SIGNATURE   = SectionType.APP_LEDGER_ENDORSER_SIGNATURE;
export const APP_LEDGER_AUTHOR_SIGNATURE     = SectionType.APP_LEDGER_AUTHOR_SIGNATURE;

const APP_LEDGER: Schema[] = [] as const;

APP_LEDGER[APP_LEDGER_ALLOWED_SIG_SCHEMES] = {
  label: 'APP_LEDGER_ALLOWED_SIG_SCHEMES',
  definition: [
    { name: 'schemeIds', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_ALLOWED_PKE_SCHEMES] = {
  label: 'APP_LEDGER_ALLOWED_PKE_SCHEMES',
  definition: [
    { name: 'schemeIds', type: DATA.TYPE_ARRAY_OF | DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_DECLARATION] = {
  label: 'APP_LEDGER_DECLARATION',
  definition: [
    { name: 'applicationId', type: DATA.TYPE_BIN256 }
  ]
};

APP_LEDGER[APP_LEDGER_ACTOR_CREATION] = {
  label: 'APP_LEDGER_ACTOR_CREATION',
  definition: [
    { name: 'id',   type: DATA.TYPE_UINT8 },
    { name: 'type', type: DATA.TYPE_UINT8 },
    { name: 'name', type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_CREATION] = {
  label: 'APP_LEDGER_CHANNEL_CREATION',
  definition: [
    { name: 'id',        type: DATA.TYPE_UINT8 },
    { name: 'isPrivate', type: DATA.TYPE_BOOLEAN },
    { name: 'creatorId', type: DATA.TYPE_UINT8 },
    { name: 'name',      type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_SHARED_SECRET] = {
  label: 'APP_LEDGER_SHARED_SECRET',
  definition: [
    { name: 'hostId',             type: DATA.TYPE_UINT8 },
    { name: 'guestId',            type: DATA.TYPE_UINT8 },
    { name: 'encryptedSharedKey', type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_CHANNEL_INVITATION] = {
  label: 'APP_LEDGER_CHANNEL_INVITATION',
  definition: [
    { name: 'channelId',  type: DATA.TYPE_UINT8 },
    { name: 'hostId',     type: DATA.TYPE_UINT8 },
    { name: 'guestId',    type: DATA.TYPE_UINT8 },
    { name: 'encryptedChannelKey', type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_ACTOR_SUBSCRIPTION] = {
  label: 'APP_LEDGER_ACTOR_SUBSCRIPTION',
  definition: [
    { name: 'actorId',            type: DATA.TYPE_UINT8 },
    { name: 'actorType',          type: DATA.TYPE_UINT8 },
    { name: 'organizationId',     type: DATA.TYPE_BIN256 },
    { name: 'signatureSchemeId',  type: DATA.TYPE_UINT8 },
    { name: 'signaturePublicKey', type: DATA.TYPE_BINARY },
    { name: 'pkeSchemeId',        type: DATA.TYPE_UINT8 },
    { name: 'pkePublicKey',       type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PUBLIC_CHANNEL_DATA] = {
  label: 'APP_LEDGER_PUBLIC_CHANNEL_DATA',
  definition: [
    { name: 'channelId', type: DATA.TYPE_UINT8 },
    { name: 'data',      type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_PRIVATE_CHANNEL_DATA] = {
  label: 'APP_LEDGER_PRIVATE_CHANNEL_DATA',
  definition: [
    { name: 'channelId',      type: DATA.TYPE_UINT8 },
    { name: 'merkleRootHash', type: DATA.TYPE_BIN256 },
    { name: 'encryptedData',  type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_AUTHOR] = {
  label: 'APP_LEDGER_AUTHOR',
  definition: [
    { name: 'authorId', type: DATA.TYPE_UINT8 }
  ]
};

APP_LEDGER[APP_LEDGER_ENDORSEMENT_REQUEST] = {
  label: 'APP_LEDGER_ENDORSEMENT_REQUEST',
  definition: [
    { name: 'endorserId', type: DATA.TYPE_UINT8 },
    { name: 'message',  type: DATA.TYPE_STRING }
  ]
};

APP_LEDGER[APP_LEDGER_ENDORSER_SIGNATURE] = {
  label: 'APP_LEDGER_ENDORSER_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

APP_LEDGER[APP_LEDGER_AUTHOR_SIGNATURE] = {
  label: 'APP_LEDGER_AUTHOR_SIGNATURE',
  definition: [
    { name: 'signature', type: DATA.TYPE_BINARY }
  ]
};

export const ALL_SECTIONS_SCHEMAS = {
  ...PROTOCOL,
  ...ACCOUNT,
  ...VALIDATOR_NODE,
  ...ORGANIZATION,
  ...APPLICATION,
  ...APP_LEDGER,
}

// ============================================================================================================================ //
//  All sections                                                                                                                //
// ============================================================================================================================ //
export const DEF: Schema[][] = [
  PROTOCOL,
  ACCOUNT,
  VALIDATOR_NODE,
  ORGANIZATION,
  APPLICATION,
  APP_LEDGER
];
