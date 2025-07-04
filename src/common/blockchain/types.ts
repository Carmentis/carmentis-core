import {BytesToHexEncoder, EncoderFactory, EncoderInterface} from "../utils/encoder";





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

export interface ValidatorNodeVBState {}

export interface OrganizationVBState {
    signatureAlgorithmId: number;
    publicKeyHeight: number;
    descriptionHeight: number;
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

export interface MicroblockInformation {
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

export interface VirtualBlockchainUpdate {
    exists: boolean,
    changed: boolean,
    stateData: Uint8Array,
    headers: Uint8Array[]
}

export interface VirtualBlockchainState<CustomState = object> {
    type: number,
    height: number,
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

export interface AccountState {
    height: number;
    balance: number;
    lastHistoryHash: Uint8Array
}

export interface AccountHash {
    accountHash: Uint8Array
}

export interface AccountHistoryEntry {
    height: number,
    previousHistoryHash: Uint8Array,
    type: number,
    timestamp: number,
    linkedAccount: Uint8Array,
    amount: number,
    chainReference: Uint8Array
}

export interface AccountHistory {
    list: AccountHistoryEntry[]
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

/**
 * Represents a hash object that allows encoding and creation from a string or Uint8Array.
 */
export class Hash {
    /**
     * Constructs a new instance of the class with the provided hash value.
     *
     * @param {Uint8Array} hash - The hash value to be used for this instance.
     */
    constructor(private hash: Uint8Array) {
    }

    /**
     * Creates a new instance of Hash from a string or Uint8Array.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const hash = Hash.from(new Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef]));
     * ```
     *
     * @param {string | Uint8Array} hash - The hash input, which can either be a string or a Uint8Array.
     * @return {Hash} A new Hash instance created from the given input.
     *
     *
     */
    static from(hash: string | Uint8Array) {
        const hexEncoder = EncoderFactory.bytesToHexEncoder();
        return new Hash(
            typeof hash == 'string' ? hexEncoder.decode(hash) : hash
        )
    }

    /**
     * Encodes the current hash using the provided encoder.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const hexEncoder = EncoderFactory.bytesToHexEncoder();
     * const hexString = hash.encode(hexEncoder); // '0x1234567890abcdef'
     * const hexString = hash.encode(); // '0x1234567890abcdef'
     * ```
     *
     * @param {EncoderInterface<Uint8Array, string>} [encoder=new BytesToHexEncoder()] - The encoder used to encode the hash. Defaults to a BytesToHexEncoder.
     * @return {string} The encoded string representation of the hash.
     */
    encode(encoder: EncoderInterface<Uint8Array, string> = new BytesToHexEncoder()): string  {
        return encoder.encode(this.hash);
    }

    /**
     * Converts and retrieves the hash value as a Uint8Array.
     *
     * ```
     * const hash = Hash.from('0x1234567890abcdef');
     * const bytes = hash.toBytes(); // Uint8Array([0x12, 0x34, 0x56, 0x78, 0x90, 0xab, 0xcd, 0xef])
     * ```
     *
     * @return {Uint8Array} The hash value as a Uint8Array.
     */
    toBytes(): Uint8Array { return this.hash }
}

export enum SectionType  {
    APP_LEDGER_SIG_ALGORITHM = "APP_LEDGER_SIG_ALGORITHM",
    APP_LEDGER_STATE = "APP_LEDGER_STATE",
    APP_LEDGER_CHANNEL = "APP_LEDGER_CHANNEL",
    APP_LEDGER_ACTOR = "APP_LEDGER_ACTOR",
    ACCOUNT_SIG_ALGORITHM = "ACCOUNT_SIG_ALGORITHM",
    ACCOUNT_STATE = "ACCOUNT_STATE",
    ACCOUNT_HISTORY = "ACCOUNT_HISTORY",
    ACCOUNT_TOKEN_ISSUANCE = "ACCOUNT_TOKEN_ISSUANCE",
    ACCOUNT_CREATION = "ACCOUNT_CREATION",
    ACCOUNT_TRANSFER = "ACCOUNT_TRANSFER",
}
