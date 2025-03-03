import { ERRORS, DATA } from "../constants/constants.js";
import { applicationError } from "../errors/error.js";

// ============================================================================================================================ //
//  check()                                                                                                                     //
// ============================================================================================================================ //
export function check(definition) {
  checkFields(definition);
  checkStructures(definition);
}

// ============================================================================================================================ //
//  checkFields()                                                                                                               //
// ============================================================================================================================ //
function checkFields(definition) {
  let fieldNames = new Set;
  
  for(let field of definition.fields) {
    if(fieldNames.has(field.name)) {
      throw new applicationError(ERRORS.APPLICATION_DUP_FIELD_NAME, field.name);
    }

    fieldNames.add(field.name);
  }
}

// ============================================================================================================================ //
//  checkStructures()                                                                                                           //
// ============================================================================================================================ //
function checkStructures(definition) {
  let structNames = new Set;

  for(let ndx in definition.internalStructures) {
    let struct = definition.internalStructures[ndx],
        branchStruct = new Set;

    if(structNames.has(struct.name)) {
      throw new applicationError(ERRORS.APPLICATION_DUP_STRUCT_NAME, struct.name);
    }

    structNames.add(struct.name);
    branchStruct.add(+ndx);

    function scan(properties) {
      let propertyNames = new Set;

      for(let item of properties) {
        if(propertyNames.has(item.name)) {
          throw new applicationError(ERRORS.APPLICATION_DUP_PROP_NAME, item.name);
        }

        propertyNames.add(item.name);

        if(item.type & DATA.STRUCT) {
          let structNdx = item.type & DATA.MSK_OBJECT_INDEX;

          if(branchStruct.has(structNdx)) {
            throw new applicationError(ERRORS.APPLICATION_CIRCULAR_REF, definition.internalStructures[structNdx].name);
          }

          branchStruct.add(structNdx);
          scan(getCollection(definition, item));
        }
      }
    }

    scan(struct.properties);
  }
}

// ============================================================================================================================ //
//  getCollection()                                                                                                             //
// ============================================================================================================================ //
export function getCollection(definition, item) {
  switch(item.structType) {
    case DATA.STRUCT_INTERNAL: {
      return definition.internalStructures[item.type & DATA.MSK_OBJECT_INDEX].properties;
    }
    case DATA.STRUCT_ORACLE: {
    }
  }
}
