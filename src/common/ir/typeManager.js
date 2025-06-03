import { DATA } from "./constants/constants.js";

const JSON_TYPES =
  1 << DATA.TYPE_ARRAY |
  1 << DATA.TYPE_OBJECT |
  1 << DATA.TYPE_STRING |
  1 << DATA.TYPE_NUMBER |
  1 << DATA.TYPE_BOOLEAN |
  1 << DATA.TYPE_NULL;

export class TypeManager {
  static getType(item) {
    switch(typeof item) {
      case "string": {
        return DATA.TYPE_STRING;
      }
      case "number": {
        return DATA.TYPE_NUMBER;
      }
      case "boolean": {
        return DATA.TYPE_BOOLEAN;
      }
      case "object": {
        if(item === null) {
          return DATA.TYPE_NULL;
        }
        if(Array.isArray(item)) {
          return DATA.TYPE_ARRAY;
        }
        if(item instanceof Uint8Array) {
          return DATA.TYPE_BINARY;
        }
        if(Object.getPrototypeOf(item).isPrototypeOf(Object)) {
          return DATA.TYPE_OBJECT;
        }
      }
    }
    return DATA.TYPE_OTHER;
  }

  static isJsonType(type) {
    return JSON_TYPES >> type & 1;
  }
}
