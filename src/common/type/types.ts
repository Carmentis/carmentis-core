export interface ImportedProof {
    height: number;
    data: {
        recordData: RecordEntry[];
        merkleData: MerkleProof[];
    };
}

export interface RecordEntry {
    type: number;
    name: string;
    properties: Property[];
    channels: Record<string, unknown>; // vide ici
}

export interface Property {
    type: number;
    name: string;

    // Champs pour propriété simple
    attributes?: number;
    channelId?: number;
    leafIndex?: number;
    salt?: string;
    value?: string;
    valueBinary?: { [key: string]: number };

    // Champs pour collection (entries)
    entries?: Property[];

    // Champs pour objets imbriqués (properties)
    properties?: Property[];

    // Présent dans tous les cas
    channels: Record<string, unknown>;

    // Présent uniquement dans les "entries"
    index?: number;
}

export interface MerkleProof {
    channelId: number;
    nLeaves: number;
    witnesses: string;
}













/*
export interface ApplicationLedgerSharedSecretState {

    peerActorId: number;


    height: number;
}

export interface ApplicationLedgerActor {
    name: string;
    subscribed: boolean;
    signatureKeyHeight: number;
    pkeKeyHeight: number;
    sharedSecrets: ApplicationLedgerSharedSecretState[];
    invitations: ApplicationLedgerActorInvitationState[];
}

 */



/**
 * Describes the local state of the application ledger.
 */
/*
export interface ApplicationLedgerInternalStateObject {
    allowedSignatureSchemeIds: number[];
    allowedPkeSchemeIds: number[];
    applicationId: Uint8Array;
    channels: ApplicationLedgerChannel[];
    actors: ApplicationLedgerActor[];
}

 */


/*
export interface GenesisSnapshotDTO {
    base64EncodedChunks: string[];
}


export interface ChainInformationDTO {
    height: number;
    lastBlockTimestamp: number;
    microblockCount: number;
    objectCounts: number[];
}

export interface BlockInformationDTO {
    hash: Uint8Array;
    timestamp: number;
    proposerAddress: Uint8Array;
    size: number;
    microblockCount: number;
}

export interface BlockContentDTO {
    microblocks: {
        hash: Uint8Array;
        vbIdentifier: Uint8Array;
        vbType: number;
        height: number;
        size: number;
        sectionCount: number;
    }[];
}

export interface ValidatorNodeDTO {
    validatorNodeHash: Uint8Array;
}

 */

export interface MicroblockHeaderObject {
    magicString: string;
    protocolVersion: number;
    microblockType: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: number;
    gasPrice: number;
    bodyHash: Uint8Array;
    feesPayerAccount: Uint8Array
}
/*
export interface MicroblockSection {
    type: number;
    data: Uint8Array;
}

export interface MicroblockBody {
    body: MicroblockSection[];
}
 */

/*
export interface MicroblockInformationSchema {
    virtualBlockchainId: Uint8Array;
    virtualBlockchainType: number;
    header: Uint8Array;
}

 */
/*
export interface MicroblockBodyResponse {
    hash: Uint8Array,
    body: Uint8Array
}

export interface MicroblockBodyListResponse {
    list: MicroblockBodyResponse[];
}

export type VirtualBlockchainUpdateInterface =
    { exists: false } |
    { exists: true, changed: false } |
    { exists: true, changed: true, stateData: Uint8Array, headers: Uint8Array[] }

export interface VirtualBlockchainState<InternalState = unknown> {
    type: number,
    height: number,
    expirationDay: number,
    lastMicroblockHash: Uint8Array,
    internalState: InternalState
}

 */

/*
export interface VirtualBlockchainStateDto {
    type: number,
    height: number,
    expirationDay: number,
    lastMicroblockHash: Uint8Array,
    serializedInternalState: Uint8Array
}

 */
/*
export interface MsgVirtualBlockchainState {
    stateData: Uint8Array
}

export interface AccountStateDTO {
    height: number;
    balance: number;
    lastHistoryHash: Uint8Array
}

 */

export interface AccountHash {
    accountHash: Uint8Array
}

export interface AccountTransactionInterface {
    height: number,
    previousHistoryHash: Uint8Array,
    type: number,
    timestamp: number,
    linkedAccount: Uint8Array,
    amount: number,
    chainReference: Uint8Array
}
/*
export interface AccountHistoryInterface {
    list: AccountTransactionInterface[]
}

 */
/*
export interface AccountTokenIssuance {
    amount: number;
}

export interface AccountCreation {
    sellerAccount: Uint8Array;
    amount: number;
}

export interface AccountTransfer {
    account: Uint8Array;
    amount: number;
    publicReference: string;
    privateReference: string;
}

export interface AccountVestingTransfer {
    account: Uint8Array;
    amount: number;
    publicReference: string;
    privateReference: string;
    cliffDurationDays: number;
    vestingDurationDays: number;
}

export interface AccountEscrowTransfer {
    account: Uint8Array;
    amount: number;
    publicReference: string;
    privateReference: string;
    agentPublicKey: Uint8Array;
}

export interface AccountStake {
    amount: number;
    nodeIdentifier: Uint8Array;
}
 */

export interface Proof {
    info: {
        title: string,
        date: string,
        author: string,
        virtualBlockchainIdentifier: string
    }, proofs: {
        height: number,
        data: any
    }[]
}
