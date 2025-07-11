import {Hash} from "../blockchain/types";
import {CMTSToken} from "../economics/currencies/token";

export abstract class MicroBlockHeader {
    abstract getMagicString(): string ;
    abstract getProtocolVersion(): number;
    abstract getHeight(): number;
    abstract getPreviousHash(): Hash;
    abstract getGas(): CMTSToken;
    abstract getGasPrice(): CMTSToken;
    abstract getBodyHash(): Hash;
}