export interface MicroBlockHeaderDto {
    magicString: string;
    protocolVersion: number;
    height: number;
    previousHash: Uint8Array;
    timestamp: number;
    gas: number;
    gasPrice: number;
    bodyHash: Uint8Array;
}