export const OTHER     = 0;
export const UNDEFINED = 1;
export const NUMBER    = 2;
export const BOOLEAN   = 3;
export const STRING    = 4;
export const ARRAY     = 5;
export const OBJECT    = 6;
export const NULL      = 7;
export const UINT8     = 8;

export const NAME = [
  "(unsupported)",
  "undefined",
  "number",
  "Boolean value",
  "string",
  "array",
  "object",
  "null",
  "Uint8Array"
];

// ============================================================================================================================ //
//  getType()                                                                                                                   //
// ============================================================================================================================ //
export function getType(v) {
  switch(typeof v) {
    case "undefined": {
      return UNDEFINED;
    }
    case "number": {
      return NUMBER;
    }
    case "boolean": {
      return BOOLEAN;
    }
    case "string": {
      return STRING;
    }
    case "object": {
      if(v === null) {
        return NULL;
      }
      if(Array.isArray(v)) {
        return ARRAY;
      }
      if(v instanceof Uint8Array) {
        return UINT8;
      }
      return OBJECT;
    }
    default: {
      return OTHER;
    }
  }
}
