import * as uint8 from "./uint8.js";

// ============================================================================================================================ //
//  jsonDump()                                                                                                                  //
// ---------------------------------------------------------------------------------------------------------------------------- //
//  Performs JSON encoding with each Uint8Array converted to a shortened hexadecimal string.                                    //
// ============================================================================================================================ //
export function jsonDump(obj, spacing = 2) {
  return JSON.stringify(
    obj,
    function (key, value) {
      if(value instanceof Uint8Array) {
        let str = uint8.toHexa(value);

        if(str.length > 32) {
          str = str.slice(0, 16) + ".." + str.slice(-16);
        }

        return `<Uint8Array(${value.length})>${str}`;
      }
      return value;
    },
    spacing
  );
}
