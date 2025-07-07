
export enum CarmentisErrorCode {
    // unspecified error
    CARMENTIS_ERROR = 0,

    // blockchain-related error
    BLOCKCHAIN_ERROR = 1,


    // economics errors
    ECONOMICS_ERROR = 2,
    INVALID_TOKEN_UNIT = 3,
}

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