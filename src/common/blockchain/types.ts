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

export interface AccountVBState {
    signatureAlgorithmId: number;
    publicKeyHeight: number;
}

export interface ApplicationDescription {
    name: string,
    logoUrl: string,
    homepageUrl: string,
    description: string
}

export interface ApplicationDeclaration {
    organizationId: Uint8Array
}

export interface OrganizationDescription {
    name: string,
    city: string,
    countryCode: string,
    website: string
}

export interface ValidatorNodeDescription {
    cometPublicKeyType: string,
    cometPublicKey: string
}

export interface ValidatorNodeNetworkIntegration {
    votingPower: number
}

export interface ValidatorNodeDeclaration {
    organizationId: Uint8Array
}

export interface OrganizationVBState {
    signatureAlgorithmId: number;
    publicKeyHeight: number;
    descriptionHeight: number;
}

export interface ValidatorNodeVBState {
    signatureAlgorithmId: number;
    organizationId: Uint8Array;
    descriptionHeight: number;
    networkIntegrationHeight: number;
}

export interface ApplicationVBState {
    signatureAlgorithmId: number;
    organizationId: Uint8Array;
    descriptionHeight: number;
}

export interface ApplicationLedgeChannel {
    name: string;
    isPrivate: boolean;
    creatorId: number;
}

export interface ApplicationLedgerActor {
    name: string;
    subscribed: boolean;
    invitations: {
        channelId: number;
        height: number;
    }[];
}

export interface ApplicationLedgerVBState {
    signatureAlgorithmId: number;
    applicationId: Uint8Array;
    channels: ApplicationLedgeChannel[];
    actors: ApplicationLedgerActor[];
}

/**
 * Provides information on the chain.
 */
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

export interface MicroblockHeader {
    magicString: string;
    protocolVersion: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: number;
    gasPrice: number;
    bodyHash: Uint8Array;
}

export interface MicroblockSection {
    type: number;
    data: Uint8Array;
}

export interface MicroblockBody {
    body: MicroblockSection[];
}

export interface MicroblockInformationSchema {
    virtualBlockchainId: Uint8Array;
    virtualBlockchainType: number;
    header: Uint8Array;
}

export interface MicroBlockBody {
    hash: Uint8Array,
    body: Uint8Array
}

export interface MicroBlockBodys {
    list: MicroBlockBody[];
}

export interface VirtualBlockchainUpdateInterface {
    exists: boolean,
    changed: boolean,
    stateData: Uint8Array,
    headers: Uint8Array[]
}

export interface VirtualBlockchainStateDTO<CustomState = any> {
    type: number,
    height: number,
    lastMicroblockHash: Uint8Array,
    customState: CustomState
}

export interface VirtualBlockchainStateInterface<CustomState = object> {
    type: number,
    height: number,
    expirationDay: number,
    lastMicroblockHash: Uint8Array,
    customState: CustomState
}

export interface MicroBlockHeader {
    magicString: string;
    protocolVersion: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: number;
    gasPrice: number;
    bodyHash: Uint8Array;
}

export interface MsgVirtualBlockchainState {
    stateData: Uint8Array
}

export interface AccountStateDTO {
    height: number;
    balance: number;
    lastHistoryHash: Uint8Array
}

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

export interface AccountHistoryInterface {
    list: AccountTransactionInterface[]
}

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

export interface ObjectList {
    list: Uint8Array[];
}

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

