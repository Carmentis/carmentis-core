import {SignatureSchemeId} from "../crypto/signature/SignatureSchemeId";
import {PublicKeyEncryptionSchemeId} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeId";
import {
    ACCOUNT_CREATION,
    ACCOUNT_ESCROW_TRANSFER,
    ACCOUNT_PUBLIC_KEY,
    ACCOUNT_SIGNATURE,
    ACCOUNT_STAKE,
    ACCOUNT_TOKEN_ISSUANCE,
    ACCOUNT_TRANSFER,
    ACCOUNT_VESTING_TRANSFER,
    ORG_DESCRIPTION,
    ORG_SERVER,
    ORG_SIGNATURE,
    PROTOCOL_CREATION,
    PROTOCOL_SIGNATURE
} from "../constants/sections";
import {ProtocolVariables} from "./ProtocolVariables";

export interface SignatureSection {
    schemeId: SignatureSchemeId,
    signature: Uint8Array
}


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

PROTOCOL[_UPDATE] = {
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
 * @see {PROTOCOL_CREATION}
 */
export interface ProtocolCreationSection {
    organizationId: Uint8Array
}


/**
 * @see {PROTOCOL_UPDATE}
 */
export interface ProtocolUpdateSection {
    protocolVersion: number;
    protocolVersionName: string;
    changeLog: string;
    protocolVariables: ProtocolVariables;
}



/**
 * @see {PROTOCOL_SIGNATURE}
 */
export type ProtocolSignatureSection = SignatureSection


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
        { name: 'account',             type: DATA.TYPE_BIN256 },
        { name: 'amount',              type: DATA.TYPE_UINT48 },
        { name: 'publicReference',     type: DATA.TYPE_STRING },
        { name: 'privateReference',    type: DATA.TYPE_STRING },
        { name: 'cliffDurationDays',   type: DATA.TYPE_UINT16 },
        { name: 'vestingDurationDays', type: DATA.TYPE_UINT16 }
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
 * @see {ACCOUNT_PUBLIC_KEY}
 */
export interface AccountPublicKeySection {
    publicKey: Uint8Array,
    schemeId: SignatureSchemeId
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
    cliffDurationDays: number,
    vestingDurationDays: number
}

/**
 * @see {ACCOUNT_ESCROW_TRANSFER}
 */
export interface AccountEscrowTransferSection {
    account: Uint8Array,
    amount: number,
    publicReference: string,
    privateReference: string,
    identifier: Uint8Array,
    agentAccount: Uint8Array,
    durationDays: number
}

/**
 * @see {ACCOUNT_ESCROW_SETTLEMENT}
 */
export interface AccountEscrowSettlementSection {
    confirmed: boolean,
    identifier: Uint8Array
}

/**
 * @see {ACCOUNT_STAKE}
 */
export interface AccountStakeSection {
    amount: number,
    objectType: number,
    objectIdentifier: Uint8Array
}

/**
 * @see {ACCOUNT_SIGNATURE}
 */
export type AccountSignatureSection = SignatureSection

// ---------------------------------------------------------------------------
// ValidatorNodeVb Sections
// ---------------------------------------------------------------------------

/**
 * @see {VN_CREATION}
 */
export interface ValidatorNodeCreationSection {
    organizationId: Uint8Array
}

/**
 * @see {VN_DESCRIPTION}
 */
export interface ValidatorNodeCometbftPublicKeyDeclarationSection {
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
export type ValidatorNodeSignatureSection = SignatureSection


// ---------------------------------------------------------------------------
// Organizations Sections
// ---------------------------------------------------------------------------


/**
 * @see {ORG_CREATION}
 */
export interface OrganizationCreationSection {
    accountId: Uint8Array
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
export type OrganizationSignatureSection = SignatureSection




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
 * @see {APP_DESCRIPTION}
 */
export interface ApplicationDescriptionSection {
    name: string,
    logoUrl: string,
    homepageUrl: string,
    description: string
}

/**
 * @see {APP_CREATION}
 */
export interface ApplicationCreationSection {
    organizationId: Uint8Array
}

/**
 * @see {APP_SIGNATURE}
 */
export type ApplicationSignatureSection = SignatureSection



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
export type ApplicationLedgerEndorserSignatureSection = SignatureSection

/**
 * @see {APP_LEDGER_AUTHOR_SIGNATURE}
 */
export type ApplicationLedgerAuthorSignatureSection = SignatureSection


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
 * @see {APP_LEDGER_CREATION}
 */
export interface ApplicationLedgerCreationSection {
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