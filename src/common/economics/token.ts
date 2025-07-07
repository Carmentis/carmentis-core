import {CENTITOKEN, MILLITOKEN} from "../constants/economics";
import {EconomicsError, InvalidTokenUnitError} from "../errors/carmentis-error";

/**
 * Enum representing the units of a tokenized system.
 *
 * `TokenUnit` defines multiple denominations of a token, where
 * each denomination is represented by a numeric value that
 * corresponds to the fractional relationship with the base unit.
 *
 * Properties:
 * - `TOKEN`: The base unit of the system. Equals 1.
 * - `CENTI_TOKEN`: Represents one-hundredth (1/100) of the base unit. Equals 100.
 * - `MILLI_TOKEN`: Represents one-thousandth (1/1000) of the base unit. Equals 1000.
 *
 * This enum can be used for token denomination conversions and comparisons.
 */
export enum TokenUnit {
    TOKEN = 1,
}


/**
 * Enum representing token unit labels.
 *
 * This enum is used to define a label for tokens, where each key represents
 * the name of the label and its associated value represents the specific token unit.
 *
 * The `TokenUnitLabel` provides a standardized way to represent token-related labels in the application.
 *
 * Enum Members:
 * - `TOKEN`: Represents the token unit labeled as 'CMTS'.
 *
 * Typically used in contexts where token structure or labeling standardization is required.
 */
export enum TokenUnitLabel {
    TOKEN = 'CMTS',
}


/**
 * A class representing a specific amount of a token in a defined unit.
 */
export class TokenAmount {
    private constructor(private amount: number, private unit: TokenUnit) {}

    /**
     * Creates an instance of TokenAmount with the given amount and unit.
     * Throws an error if the provided unit is not of type TokenUnit.TOKEN.
     *
     * @param {number} amount - The numeric amount to be used for the TokenAmount instance.
     * @param {TokenUnit} [unit=TokenUnit.TOKEN] - The unit type for the token, defaults to TokenUnit.TOKEN.
     * @return {TokenAmount} A new instance of TokenAmount with the specified amount and unit.
     */
    static create(amount: number, unit: TokenUnit = TokenUnit.TOKEN) {
        if (unit != TokenUnit.TOKEN) throw new InvalidTokenUnitError();
        return new TokenAmount(amount, unit);
    }

    /**
     * Parses a string representing a token amount and returns a TokenAmount instance.
     *
     * @param {string} value - The input string containing a numeric amount followed by a unit (e.g., "10.50 TOKEN").
     * @return {TokenAmount} A TokenAmount object containing the parsed numeric amount and the token unit.
     * @throws {EconomicsError} If the input string format is invalid.
     * @throws {InvalidTokenUnitError} If the unit in the input string is not valid.
     */
    static parse(value: string) {
        const match = value.trim().match(/^(\d+(?:\.\d{1,2})?)\s*([A-Z]{2,})$/);
        if (!match) {
            throw new EconomicsError(`Invalid token amount format: "${value}"`);
        }
        const [, amountStr, unit] = match;
        if (unit != TokenUnitLabel.TOKEN) throw new InvalidTokenUnitError();
        const amount = parseFloat(amountStr);
        return new TokenAmount(amount, TokenUnit.TOKEN);
    }


    /**
     * Compares the current TokenAmount instance with another TokenAmount instance for equality.
     *
     * @param {TokenAmount} other - The TokenAmount instance to compare with the current instance.
     * @return {boolean} Returns true if both TokenAmount instances have the same amount and unit, otherwise returns false.
     */
    equals(other: TokenAmount): boolean {
        return this.amount === other.amount && this.unit === other.unit;
    }

    /**
     * Compares the current TokenAmount with another TokenAmount to determine if it is greater.
     *
     * @param {TokenAmount} other The TokenAmount to compare with.
     * @return {boolean} Returns true if the current TokenAmount is greater than the given TokenAmount, otherwise false.
     */
    isGreaterThan(other: TokenAmount): boolean {
        return this.amount > other.amount;
    }

    /**
     * Compares the current TokenAmount instance with another TokenAmount instance
     * to determine if it is less than the specified instance.
     *
     * @param {TokenAmount} other - The TokenAmount instance to compare against.
     * @return {boolean} True if the current instance is less than the specified instance, otherwise false.
     */
    isLessThan(other: TokenAmount): boolean {
        return this.amount < other.amount;
    }

    /**
     * Converts the object to a string representation combining the amount and its unit label.
     * The returned string typically includes the numerical value and its corresponding unit.
     *
     * @return {string} A string representation of the object in the format "{amount} {unitLabel}".
     */
    toString() {
        return `${this.amount} ${this.getUnitLabel()}`;
    }

    /**
     * Retrieves the label corresponding to the current unit of the token.
     *
     * @return {TokenUnitLabel} The label associated with the unit.
     * @throws {InvalidTokenUnitError} If the unit does not have a defined label.
     */
    private getUnitLabel() {
        switch (this.unit) {
            case TokenUnit.TOKEN: return TokenUnitLabel.TOKEN;
            default: throw new InvalidTokenUnitError()
        }
    }
}