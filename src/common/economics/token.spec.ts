import {CMTSToken, TokenUnit} from './currencies/token';
import {EconomicsError} from '../errors/carmentis-error';


describe('TokenAmount', () => {
    describe('TokenAmount.parse', () => {
        it('should correctly parse a valid token amount string with unit', () => {
            const result = CMTSToken.parse('123.45 CMTS');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should correctly parse a valid token amount string with trailing spaces', () => {
            const result = CMTSToken.parse('  123.45 CMTS  ');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should reject an invalid atomic amount', () => {
            expect(() => CMTSToken.parse('  123.45 aCMTS  ')).toThrow(EconomicsError);
        });

        it('should reject with a too precise atomic', () => {
            expect(() => CMTSToken.parse('  123.123456789 CMTS  ')).toThrow(EconomicsError);
        });

        it('should accept decimal token', () => {
            expect(CMTSToken.parse('  123.12345 CMTS  ')).toBeInstanceOf(CMTSToken)
        });

        it('should correctly parse a valid token amount string with trailing spaces', () => {
            const result = CMTSToken.parse('  123.45 CMTS  ');
            expect(result.toString()).toBe('123.45 CMTS');
        });

        it('should throw an error for an invalid token amount format', () => {
            expect(() => CMTSToken.parse('123.456 TOKEN')).toThrow(EconomicsError);
        });

        it('should throw an error for a string without unit', () => {
            expect(() => CMTSToken.parse('123.45')).toThrow(EconomicsError);
        });

        it('should throw an error for an invalid unit format', () => {
            expect(() => CMTSToken.parse('123.45 TOKENS')).toThrow(EconomicsError);
        });

        it('should throw an error for a completely invalid format', () => {
            expect(() => CMTSToken.parse('invalid string')).toThrow(EconomicsError);
        });
    });

    describe('TokenAmount.create', () => {
        it('should create a valid TokenAmount instance', () => {
            const result = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(result.toString()).toBe('123.45 CMTS');
        });

    });

    describe('equals', () => {
        it('should return true for equal token amounts', () => {
            const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
            const b = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(a.equals(b)).toBe(true);
        });

        it('should return false for different token amounts', () => {
            const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
            const b = CMTSToken.create(100, TokenUnit.TOKEN);
            expect(a.equals(b)).toBe(false);
        });
    });

    describe('isGreaterThan and isLessThan', () => {
        const a = CMTSToken.create(123.45, TokenUnit.TOKEN);
        const b = CMTSToken.create(100, TokenUnit.TOKEN);

        it('should return true if a is greater than b', () => {
            expect(a.isGreaterThan(b)).toBe(true);
        });

        it('should return true if a is less than b', () => {
            expect(b.isLessThan(a)).toBe(true);
        });
    });

    describe('toString', () => {
        it('should return the correct string representation', () => {
            const result = CMTSToken.create(123.45, TokenUnit.TOKEN);
            expect(result.toString()).toBe('123.45 CMTS');
        });
    });

    describe("Add and sub correctly", () =>  {
        it("Should add two amounts correctly", () => {
            const a = CMTSToken.createCMTS(10);
            const b = CMTSToken.createCMTS(90);
            const c = CMTSToken.createCMTS(100);
            expect(a.add(b)).toEqual(c)
        })

        it("Should sub two amounts correctly", () => {
            const a = CMTSToken.createCMTS(100);
            const b = CMTSToken.createCMTS(10);
            const c = CMTSToken.createCMTS(90);
            expect(a.sub(b)).toEqual(c)
        })
    })
});