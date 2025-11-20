import {HCVCodec} from '../common/utils/HCVCodec';

describe('HCVCodec', () => {
  describe('encode', () => {
    it('should encode a single key and value correctly', () => {
      const encoded = HCVCodec.encode('key1', 'value1');
      expect(encoded).toBe('key1{value1}');
    });

    it('should encode multiple keys and a value correctly', () => {
      const encoded = HCVCodec.encode('key1', 'key2', 'key3', 'value2');
      expect(encoded).toBe('key1:key2:key3{value2}');
    });

    it('should handle empty value correctly', () => {
      const encoded = HCVCodec.encode('key1', '');
      expect(encoded).toBe('key1{}');
    });
  });

  describe('decode', () => {
    it('should decode a simple encoded string correctly', () => {
      const decoded = HCVCodec.decode('key1{value1}');
      
      expect(decoded.getKeys()).toEqual(['key1']);
      expect(decoded.getValue()).toBe('value1');
      expect(decoded.matchesKeys('key1')).toBe(true);
      expect(decoded.matchesKeys('key2')).toBe(false);
    });

    it('should decode a string with multiple keys correctly', () => {
      const decoded = HCVCodec.decode('key1:key2:key3{value2}');
      
      expect(decoded.getKeys()).toEqual(['key1', 'key2', 'key3']);
      expect(decoded.getValue()).toBe('value2');
      expect(decoded.matchesKeys('key1', 'key2', 'key3')).toBe(true);
      expect(decoded.matchesKeys('key1', 'key2')).toBe(false);
    });

    it('should decode a string with empty value correctly', () => {
      const decoded = HCVCodec.decode('key1{}');
      
      expect(decoded.getKeys()).toEqual(['key1']);
      expect(decoded.getValue()).toBe('');
    });
  });

  describe('round-trip', () => {
    it('should correctly round-trip encode and decode', () => {
      const originalKeys = ['context', 'user', 'profile'];
      const originalValue = 'userData123';
      
      const encoded = HCVCodec.encode(...originalKeys, originalValue);
      const decoded = HCVCodec.decode(encoded);
      
      expect(decoded.getKeys()).toEqual(originalKeys);
      expect(decoded.getValue()).toBe(originalValue);
      expect(decoded.matchesKeys(...originalKeys)).toBe(true);
    });
  });
});