export interface MicroblockHeader {
    magicString: string;
    protocolVersion: number;
    height: bigint;
    previousHash: Uint8Array;
    timestamp: bigint;
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

export interface VirtualBlockchainState {
    type: number,
    height: number,
    lastMicroblockHash: Uint8Array,
    customState: object
}

export interface AccountState {
    height: number;
    balance: number;
    lastHistoryHash: Uint8Array
}

export interface AccountHash {
    accountHash: Uint8Array
}

export interface AccountHistory {
    list: {
        height: number,
        previousHistoryHash: Uint8Array,
        type: number,
        timestamp: number,
        linkedAccount: Uint8Array,
        amount: number,
        chainReference: Uint8Array
    }[]
}