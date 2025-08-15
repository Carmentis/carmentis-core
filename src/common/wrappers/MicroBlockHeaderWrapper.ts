import {CMTSToken} from "../economics/currencies/token";
import {Hash} from "../entities/Hash";
import {MicroBlockHeaderDto} from "../entities/MicroBlockHeaderDto";

export class MicroBlockHeaderWrapper {
    constructor(
        private readonly header: MicroBlockHeaderDto
    ) {}

    getMagicString(): string {
        return this.header.magicString;
    }

    getProtocolVersion(): number {
        return this.header.protocolVersion;
    }
    getHeight(): number {
        return this.header.height;
    }
    getPreviousHash(): Hash {
        return Hash.from(this.header.previousHash);
    }
    getGas(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gas);
    }

    getGasPrice(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gasPrice);
    }
    getBodyHash(): Hash {
        return Hash.from(this.header.bodyHash);
    }
}