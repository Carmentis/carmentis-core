import {CMTSToken} from "../economics/currencies/token";
import {Hash} from "./Hash";
import {AccountStateDTO} from "../blockchain/types";

export class AccountState {
    private constructor(private height: number, private balance: CMTSToken, private lastHistoryHash: Hash, private lastPublicKeyDeclarationHeight: number) {
    }

    static createFromDTO(dto: AccountStateDTO) {
        return new AccountState(
            dto.height,
            CMTSToken.createAtomic(dto.balance),
            Hash.from(dto.lastHistoryHash),
            0
        )
    }

    isEmpty(): boolean {
        return this.height === 0;
    }

    getHeight(): number {
        return this.height;
    }

    getBalance(): CMTSToken {
        return this.balance;
    }

    getLastHistoryHash(): Hash {
        return this.lastHistoryHash;
    }

    getLastPublicKeyDeclarationHeight(): number {
        return this.lastPublicKeyDeclarationHeight;
    }
}