import { DATA } from "../constants/constants.js";

// ============================================================================================================================ //
//  getCollection()                                                                                                             //
// ============================================================================================================================ //
export function getCollection(definition, item) {
  switch(item.structType) {
    case DATA.STRUCT_INTERNAL: {
      return definition.structures[item.type & DATA.MSK_OBJECT_INDEX].properties;
    }
    case DATA.STRUCT_ORACLE_ANSWER: {
    }
  }
}
