import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import * as DATA from "../constants/data";
import {CONTRACT_SCHEMA} from "../constants/schemas";
import {
    ACCOUNT_CREATION, ACCOUNT_ESCROW_TRANSFER,
    ACCOUNT_PUBLIC_KEY,
    ACCOUNT_SIG_SCHEME,
    ACCOUNT_SIGNATURE, ACCOUNT_STAKE, ACCOUNT_TOKEN_ISSUANCE, ACCOUNT_TRANSFER, ACCOUNT_VESTING_TRANSFER,
    ORG_DESCRIPTION,
    ORG_PUBLIC_KEY, ORG_SERVER,
    ORG_SIG_SCHEME, ORG_SIGNATURE,
    PROTOCOL_NODE_UPDATE,
    PROTOCOL_PROTOCOL_UPDATE,
    PROTOCOL_PUBLIC_KEY,
    PROTOCOL_SIG_SCHEME, PROTOCOL_SIGNATURE
} from "../constants/sections";

// ---------------------------------------------------------------------------
// ProtocolVB Sections
// ---------------------------------------------------------------------------


/*
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
 */

/**
 * @see {PROTOCOL_SIG_SCHEME}
 */
export interface ProtocolSigSchemeSection {
    schemeId: SignatureSchemeId
}

/**
 * @see {PROTOCOL_PUBLIC_KEY}
 */
export interface ProtocolPublicKeySection {
    publicKey: Uint8Array
}

/**
 * @see {PROTOCOL_PROTOCOL_UPDATE}
 */
export interface ProtocolProtocolUpdateSection {
    effectiveUtcTimestamp: number,
    version: number,
    codeName: string,
    changeLog: string,
    contracts: any[]
}

/**
 * @see {PROTOCOL_NODE_UPDATE}
 */
export interface ProtocolNodeUpdateSection {
    organizationId: Uint8Array,
    version: string,
    maxProtocolVersion: number,
    changeLog: string,
    url: string
}

/**
 * @see {PROTOCOL_SIGNATURE}
 */
export interface ProtocolSignatureSection {
    signature: Uint8Array
}


// ---------------------------------------------------------------------------
// AccountVb Sections
// ---------------------------------------------------------------------------



/*
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

 */

/**
 * @see {ACCOUNT_SIG_SCHEME}
 */
export interface AccountSigSchemeSection {
    schemeId: SignatureSchemeId
}

/**
 * @see {ACCOUNT_PUBLIC_KEY}
 */
export interface AccountPublicKeySection {
    publicKey: Uint8Array
}

/**
 * @see {ACCOUNT_TOKEN_ISSUANCE}
 */
export interface AccountTokenIssuanceSection {
    amount: number
}

/**
 * @see {ACCOUNT_CREATION}
 */
export interface AccountCreationSection {
    sellerAccount: Uint8Array,
    amount: number
}

/**
 * @see {ACCOUNT_TRANSFER}
 */
export interface AccountTransferSection {
    account: Uint8Array,
    amount: number,
    publicReference: string,
    privateReference: string
}

/**
 * @see {ACCOUNT_VESTING_TRANSFER}
 */
export interface AccountVestingTransferSection {
    account: Uint8Array,
    amount: number,
    publicReference: string,
    privateReference: string,
    cliffPeriod: number,
    vestingPeriod: number
}

/**
 * @see {ACCOUNT_ESCROW_TRANSFER}
 */
export interface AccountEscrowTransferSection {
    account: Uint8Array,
    amount: number,
    publicReference: string,
    privateReference: string,
    agentPublicKey: Uint8Array
}

/**
 * @see {ACCOUNT_STAKE}
 */
export interface AccountStakeSection {
    amount: number,
    nodeIdentifier: Uint8Array
}

/**
 * @see {ACCOUNT_SIGNATURE}
 */
export interface AccountSignatureSection {
    signature: Uint8Array
}


// ---------------------------------------------------------------------------
// ValidatorNodeVb Sections
// ---------------------------------------------------------------------------
/*VALIDATOR_NODE[VN_SIG_SCHEME] = {
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
 */


/**
 * @see {VN_SIG_SCHEME}
 */
export interface ValidatorNodeSigSchemeSection {
    schemeId: SignatureSchemeId
}

/**
 * @see {VN_DECLARATION}
 */
export interface ValidatorNodeDeclarationSection {
    organizationId: Uint8Array
}

/**
 * @see {VN_DESCRIPTION}
 */
export interface ValidatorNodeDescriptionSection {
    cometPublicKeyType: string,
    cometPublicKey: string
}

/**
 * @see {VN_RPC_ENDPOINT}
 */
export interface ValidatorNodeRpcEndpointSection {
    rpcEndpoint: string
}

/**
 * @see {VN_VOTING_POWER_UPDATE}
 */
export interface ValidatorNodeVotingPowerUpdateSection {
    votingPower: number
}

/**
 * @see {VN_SIGNATURE}
 */
export interface ValidatorNodeSignatureSection {
    signature: Uint8Array
}



// ---------------------------------------------------------------------------
// Organizations Sections
// ---------------------------------------------------------------------------
/*
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

ORGANIZATION[ORG_SIGNATURE] = {
    label: 'ORG_SIGNATURE',
    definition: [
        { name: 'signature', type: DATA.TYPE_BINARY }
    ]
};

 */


/**
 * @see {ORG_SIG_SCHEME}
 */
export interface OrganizationSigSchemeSection {
    schemeId: SignatureSchemeId
}

/**
 * @see {ORG_PUBLIC_KEY}
 */
export interface OrganizationPublicKeySection {
    publicKey: Uint8Array
}

/**
 * @see {ORG_DESCRIPTION}
 */
export interface OrganizationDescriptionSection {
    name: string,
    city: string,
    countryCode: string,
    website: string
}

/**
 * @deprecated Should use OrganizationDescriptionSection
 */
export type OrganizationDescription = OrganizationDescriptionSection;

/**
 * @deprecated
 * @see {ORG_SERVER}
 */
export interface OrganizationServerSection {
    endpoint: string
}

/**
 * @see {ORG_SIGNATURE}
 */
export interface OrganizationSignatureSection {
    signature: Uint8Array
}


// ---------------------------------------------------------------------------
// Application Sections
// ---------------------------------------------------------------------------

/*

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
 */

/**
 * @see {APP_SIG_SCHEME}
 */
export interface ApplicationSigSchemeSection {
    schemeId: SignatureSchemeId
}

/**
 * @see {APP_DESCRIPTION}
 */
export interface ApplicationDescriptionSection {
    name: string,
    logoUrl: string,
    homepageUrl: string,
    description: string
}

/**
 * @see {APP_DECLARATION}
 */
export interface ApplicationDeclarationSection {
    organizationId: Uint8Array
}

/**
 * @see {APP_SIGNATURE}
 */
export interface ApplicationSignatureSection {
    signature: Uint8Array
}



// ---------------------------------------------------------------------------
// Application ledger Sections
// ---------------------------------------------------------------------------

/*

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
 */


/**
 * @see {APP_LEDGER_ALLOWED_SIG_SCHEMES}
 */
export interface ApplicationLedgerAllowedSigSchemesSection {
    schemeIds: SignatureSchemeId[]
}

/**
 * @see {APP_LEDGER_ALLOWED_PKE_SCHEMES}
 */
export interface ApplicationLedgerAllowedPkeSchemesSection {
    schemeIds: PublicKeyEncryptionSchemeId[]
}

/**
 * @see {APP_LEDGER_CHANNEL_CREATION}
 */
export interface ApplicationLedgerChannelCreationSection {
    id: number,
    isPrivate: boolean,
    creatorId: number,
    name: string
}

/**
 * @see {APP_LEDGER_AUTHOR}
 */
export interface ApplicationLedgerAuthorSection {
    authorId: number
}

/**
 * @see {APP_LEDGER_ENDORSEMENT_REQUEST}
 */
export interface ApplicationLedgerEndorsementRequestSection {
    endorserId: number,
    message: string,
}

/**
 * @see {APP_LEDGER_ENDORSER_SIGNATURE}
 */
export interface ApplicationLedgerEndorserSignatureSection {
    signature: Uint8Array
}

/**
 * @see {APP_LEDGER_AUTHOR_SIGNATURE}
 */
export interface ApplicationLedgerAuthorSignatureSection {
    signature: Uint8Array
}


/**
 * @see {APP_LEDGER_CHANNEL_INVITATION}
 */
export interface ApplicationLedgerChannelInvitationSection {
    channelId: number;
    hostId: number;
    guestId: number;
    encryptedChannelKey: Uint8Array;
}

/**
 * @see {APP_LEDGER_ACTOR_CREATION}
 */
export interface ApplicationLedgerActorCreationSection {
    id: number,
    type: number,
    name: string,
}

/**
 * @see {APP_LEDGER_DECLARATION}
 */
export interface ApplicationLedgerDeclarationSection {
    applicationId: Uint8Array
}

/**
 * @see {APP_LEDGER_SHARED_SECRET}
 */
export interface ApplicationLedgerSharedKeySection {
    hostId: number;
    guestId: number;
    encryptedSharedKey: Uint8Array
}

/**
 * @see {APP_LEDGER_PRIVATE_CHANNEL_DATA}
 */
export interface ApplicationLedgerPrivateChannelSection {
    channelId: number,
    merkleRootHash: Uint8Array,
    encryptedData: Uint8Array,
}

/**
 * @see {APP_LEDGER_PUBLIC_CHANNEL_DATA}
 */
export interface ApplicationLedgerPublicChannelSection {
    channelId: number,
    data: Uint8Array,
}

/**
 * @see {APP_LEDGER_ACTOR_SUBSCRIPTION}
 */
export interface ApplicationLedgerActorSubscriptionSection {
    actorId: number,
    actorType: number,
    organizationId: Uint8Array,
    signatureSchemeId: SignatureSchemeId,
    signaturePublicKey: Uint8Array,
    pkeSchemeId: PublicKeyEncryptionSchemeId,
    pkePublicKey: Uint8Array
}