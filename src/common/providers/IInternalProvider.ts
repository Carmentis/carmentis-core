export interface IInternalProvider {
    getMicroblockVbInformation(hash: Uint8Array): Promise<Uint8Array | null>;

    getMicroblock(identifier: Uint8Array): Promise<Uint8Array>;

    getSerializedMicroblockHeader(identifier: Uint8Array): Promise<Uint8Array | null>;

    getMicroblockBody(identifier: Uint8Array): Promise<Uint8Array | null>;

    getSerializedVirtualBlockchainState(identifier: Uint8Array): Promise<Uint8Array | null>;

    getAccountByPublicKeyHash(publicKeyHash: Uint8Array): Promise<Uint8Array | null>;

    setMicroblockVbInformation(identifier: Uint8Array, data: Uint8Array): Promise<void>;

    setMicroblockHeader(identifier: Uint8Array, data: Uint8Array): Promise<void>;

    setMicroblockBody(identifier: Uint8Array, data: Uint8Array): Promise<void>;

    setSerializedVirtualBlockchainState(identifier: Uint8Array, data: Uint8Array): Promise<void>;

}