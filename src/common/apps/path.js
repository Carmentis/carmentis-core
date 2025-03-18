import { DATA, ERRORS } from "../constants/constants.js";
import * as appDefinition from "./definition.js";
import { pathError } from "../errors/error.js";

// ============================================================================================================================ //
//  encode()                                                                                                                    //
// ============================================================================================================================ //
export function encode(def, pathStr, allowWildcard) {
  let array = pathStr.split("."),
      schema = def.fields,
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
        ndx = schema.findIndex(field => field.name == part);

    if(!~ndx) {
      throw new pathError(ERRORS.PATH_UNKNOWN_FIELD, part);
    }

    path.push(ndx);

    let item = schema[ndx];

    if(item.type & DATA.STRUCT) {
      if(endOfList) {
        throw new pathError(ERRORS.PATH_INCOMPLETE_STRUCT, part);
      }
      schema = appDefinition.getSchema(def, item);
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
  let schema = def.fields,
      path = [];

  for(let ndx of array) {
    let item = schema[ndx];

    if(!item) {
      throw new pathError(ERRORS.PATH_INVALID_ENCODING);
    }

    path.push(item.name);

    if(item.type & DATA.STRUCT) {
      schema = appDefinition.getSchema(def, item);
    }
  }

  return path.join(".");
}
