import { DATA, ERRORS } from "../constants/constants.js";
import { pathError } from "../errors/error.js";

// ============================================================================================================================ //
//  encode()                                                                                                                    //
// ============================================================================================================================ //
export function encode(def, pathStr, allowWildcard) {
  let array = pathStr.split("."),
      collection = def.fields,
      path = [];

  for(let i in array) {
    let part = array[i];

    if(part == "*") {
      if(allowWildcard) {
        path.push(DATA.WILDCARD);
        return path;
      }
      throw new pathError(ERRORS.PATH_UNEXPECTED_WILDCARD, part);
    }

    let endOfList = i == array.length - 1,
        ndx = collection.findIndex(field => field.name == part);

    if(!~ndx) {
      throw new pathError(ERRORS.PATH_UNKNOWN_FIELD, part);
    }

    path.push(ndx);

    let item = collection[ndx];

    if(item.type & DATA.STRUCT) {
      if(endOfList) {
        throw new pathError(ERRORS.PATH_INCOMPLETE_STRUCT, part);
      }
      collection = def.structures[item.type & DATA.MSK_META_ID].properties;
    }
    else {
      if(!endOfList) {
        throw new pathError(ERRORS.PATH_NOT_A_STRUCT, part);
      }
      return path;
    }
  }
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
export function decode(def, array) {
  let collection = def.fields,
      path = [];

  for(let ndx of array) {
    let item = collection[ndx];

    if(!item) {
      throw new pathError(ERRORS.PATH_INVALID_ENCODING);
    }

    path.push(item.name);

    if(item.type & DATA.STRUCT) {
      collection = def.structures[item.type & DATA.MSK_META_ID].properties;
    }
  }

  return path.join(".");
}
