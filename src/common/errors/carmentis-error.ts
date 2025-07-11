import {PublicSignatureKey} from "../crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../crypto/signature/signature-encoder";
import {SectionType} from "../proto/section";
import {Hash} from "../entities/Hash";

export enum CarmentisErrorCode {
    // unspecified error
    CARMENTIS_ERROR = 0,

    // blockchain-related error
    BLOCKCHAIN_ERROR = 100,
    ACCOUNT_NOT_FOUND,
    ACCOUNT_ALREADY_EXISTS,
    ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY,
    ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY_HASH,
    ACCOUNT_ALREADY_EXISTS_FOR_PUBLIC_KEY,
    ACCOUNT_NOT_FOUND_FOR_ADDRESS,
    VIRTUAL_BLOCKCHAIN_NOT_FOUND,
    VIRTUAL_BLOCKCHAIN_ALREADY_EXISTS,


    // economics errors
    ECONOMICS_ERROR = 200,
    INVALID_TOKEN_UNIT,
}



export class IllegalUsageError extends Error {}
export class IllegalParameterError extends IllegalUsageError {}


export class CarmentisError extends Error {
    constructor(message: string, private code: CarmentisErrorCode = CarmentisErrorCode.CARMENTIS_ERROR) {
        super(`${message} (code ${code})`);
    }

    getErrorCode() {
        return this.code
    }

    static isCarmentisError(error: any): error is CarmentisError {
        return error instanceof CarmentisError;
    }
}

export class NodeError extends CarmentisError {

}

export class EconomicsError extends CarmentisError {
    constructor(message: string, code: CarmentisErrorCode = CarmentisErrorCode.ECONOMICS_ERROR) {
        super(message, code);
    }
}

export class InvalidTokenUnitError extends EconomicsError {
    constructor() {
        super("Invalid unit type", CarmentisErrorCode.INVALID_TOKEN_UNIT);
    }
}

export class BlockchainError extends CarmentisError {
    constructor(message: string, code: CarmentisErrorCode = CarmentisErrorCode.BLOCKCHAIN_ERROR) {
        super(message, code);
    }
}


export class NotImplementedError extends Error {
    constructor() {
        super("No implemented");

    }

}

export class MicroBlockNotFoundInVirtualBlockchainAtHeightError extends BlockchainError {
    constructor(vbId: Hash, height: number) {
        super(`MicroBlock in virtual blockchain ${vbId.encode()} not found at height ${height}`);
    }
}
export class SectionError extends BlockchainError {}
export class SectionNotFoundError extends SectionError {
    constructor(sectionType: SectionType) {
        super(`Section type ${sectionType} not found`);
    }
}

export class AccountNotFoundForPublicKeyError extends BlockchainError {
    private static encoder = StringSignatureEncoder.defaultStringSignatureEncoder();
    constructor(publicKey: PublicSignatureKey) {
        super(
            AccountNotFoundForPublicKeyError.encoder.encodePublicKey(publicKey),
            CarmentisErrorCode.ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY
        );
    }
}

export class AccountNotFoundForAccountHashError extends BlockchainError {
    constructor(accountHash: Hash) {
        super(
            `Account not found for account hash: ${accountHash.encode()}`,
            CarmentisErrorCode.ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY
        );
    }
}

export class AccountNotFoundForPublicKeyHashError extends BlockchainError {
    constructor(publicKeyHash: Hash) {
        super(
            `Account not found for public key hash: ${publicKeyHash.encode()}`,
            CarmentisErrorCode.ACCOUNT_NOT_FOUND_FOR_PUBLIC_KEY_HASH
        );
    }
}


export class VirtualBlockchainNotFoundError extends BlockchainError {
    constructor(virtualBlockchainId: Hash) {
        super(
            `Virtual blockchain not found: ${virtualBlockchainId}`,
            CarmentisErrorCode.VIRTUAL_BLOCKCHAIN_ALREADY_EXISTS
        );
    }
}
