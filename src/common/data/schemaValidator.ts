import { DATA } from "../constants/constants.js";
import { TypeManager, TypeChecker } from "./types.js";

export class SchemaValidator {
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema) {
    this.schema = schema;
  }

  /**
    Checks whether the given object matches the schema.
    @param {object} object - The object to be tested.
  */
  validate(object) {
    this.validateObject(this.schema, object);
  }

  /**
    Validates any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
    @param {object} object - The object to be serialized.
  */
  validateObject(schema, object, path = "") {
    for(const definition of schema) {
      const fieldPath = path + (path && ".") + definition.name,
            value = object[definition.name];

      if(value === undefined) {
        if(definition.optional) {
          continue;
        }
        throw `field '${fieldPath}' is missing`;
      }

      if(definition.type & DATA.TYPE_ARRAY_OF) {
        if(TypeManager.getType(value) != DATA.TYPE_ARRAY) {
          throw `'${fieldPath}' is not an array`;
        }

        for(const index in value) {
          this.validateItem(definition, value[index], fieldPath + `[${index}]`);
        }
      }
      else {
        this.validateItem(definition, value, fieldPath);
      }
    }
  }

  /**
    Validates an item.
    @param {object} definition - The definition of the item.
    @param {} value - The value of the item.
  */
  validateItem(definition, value, fieldPath) {
    const mainType = definition.type & DATA.TYPE_MAIN;

    if(mainType == DATA.TYPE_OBJECT) {
      if(TypeManager.getType(value) != DATA.TYPE_OBJECT) {
        throw `'${fieldPath}' is not an object`;
      }
      if(!definition.unspecifiedSchema) {
        this.validateObject(definition.schema, value, fieldPath);
      }
    }
    else {
      const typeChecker = new TypeChecker(definition, value);

      try {
        typeChecker.check();
      }
      catch(error) {
        throw `Error on field '${fieldPath}': ${error}`;
      }
    }
  }
}
