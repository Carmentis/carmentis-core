import {Utils} from "./utils";

describe('TypeManager', () => {
    it('should correctly encode and decode three numbers', () => {
        expect(Utils.binaryFrom(1,0,2)).toBeInstanceOf(Uint8Array);
        expect(Utils.binaryFrom(1,0, new Uint8Array(Utils.intToByteArray(2, 6)))).toBeInstanceOf(Uint8Array);
    })
});