import * as CST from "./constants.js";

const MAX_UINT8_ARRAY_SHOWN_SIZE = 24;

export class jsonManager {
  static getType(item) {
    switch(typeof item) {
      case "string": {
        return CST.T_STRING;
      }
      case "number": {
        return CST.T_NUMBER;
      }
      case "boolean": {
        return CST.T_BOOLEAN;
      }
      case "object": {
        if(Array.isArray(item)) {
          return CST.T_ARRAY;
        }
        if(item === null) {
          return CST.T_NULL;
        }
        if(Object.getPrototypeOf(item).isPrototypeOf(Object)) {
          return CST.T_OBJECT;
        }
        throw `Invalid JSON type`;
      }
    }
  }

  static stringifyIRObject(irObject) {
    return JSON.stringify(
      irObject,
      (key, value) => {
        if(value instanceof Uint8Array) {
          return [
            `<${value.length} byte(s)>`,
            ...[ ...value.slice(0, MAX_UINT8_ARRAY_SHOWN_SIZE) ].map(v =>
              v.toString(16).toUpperCase().padStart(2, "0")
            )
          ].join(" ") +
          (value.length > MAX_UINT8_ARRAY_SHOWN_SIZE ? " .." : "");
        }
        if(value instanceof Set) {
          return [ ...value ];
        }
        return value;
      },
      2
    );
  }
}
