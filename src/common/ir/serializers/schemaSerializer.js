import { WriteStream, ReadStream } from "./byteStreams.js";
import { TypeManager, TypeChecker } from "../utils/types.js";
import { DATA } from "../constants/constants.js";

export class SchemaSerializer {
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema) {
    this.schema = schema;
  }

  /**
    Serializes the given object.
    @param {object} object - The object to be serialized.
  */
  serialize(object) {
    this.stream = new WriteStream;
    this.serializeObject(this.schema, object);

    return this.stream.getByteStream();
  }

  /**
    Serializes any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
    @param {object} object - The object to be serialized.
  */
  serializeObject(schema, object, path = "") {
    for(const definition of schema) {
      const fieldPath = (path && ".") + definition.name,
            value = object[definition.name];

      if(value === undefined) {
        throw `field '${fieldPath}' is missing`;
      }

      if(definition.type & DATA.TYPE_ARRAY_OF) {
        if(TypeManager.getType(value) != DATA.TYPE_ARRAY) {
          throw `'${fieldPath}' is not an array`;
        }

        if(definition.size !== undefined) {
          if(value.length != definition.size) {
            throw `invalid size for '${fieldPath}' (expecting ${definition.size} entries, got ${value.length})`;
          }
        }
        else {
          this.stream.writeVarUint(value.length);
        }

        for(const index in value) {
          this.serializeItem(definition, value[index], fieldPath + `[${index}]`);
        }
      }
      else {
        this.serializeItem(definition, value, fieldPath);
      }
    }
  }

  /**
    Serializes an item.
    @param {object} definition - The definition of the item.
    @param {} value - The value of the item.
  */
  serializeItem(definition, value, fieldPath) {
    const mainType = definition.type & DATA.TYPE_MAIN;

    if(mainType == DATA.TYPE_OBJECT) {
      if(TypeManager.getType(value) != DATA.TYPE_OBJECT) {
        throw `'${fieldPath}' is not an object`;
      }
      this.serializeObject(definition.schema, value, fieldPath);
    }
    else {
      const typeChecker = new TypeChecker(definition, value);

      try {
        typeChecker.check();
      }
      catch(error) {
        throw `Error on field '${fieldPath}': ${error}`;
      }

      this.stream.writeSchemaValue(mainType, value, definition.size);
    }
  }
}

export class SchemaUnserializer {
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema) {
    this.schema = schema;
  }

  /**
    Unserializes the given byte stream.
    @param {Uint8Array} stream - The serialized byte stream
  */
  unserialize(stream) {
    this.stream = new ReadStream(stream);

    const object = this.unserializeObject(this.schema),
          pointer = this.stream.getPointer(),
          size = stream.length;

    if(pointer != size) {
      throw `Invalid stream length (decoded ${pointer} bytes, actual length is ${size} bytes)`;
    }

    return object;
  }

  /**
    Unserializes any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
  */
  unserializeObject(schema) {
    const object = {};

    for(const definition of schema) {
      let item;

      if(definition.type & DATA.TYPE_ARRAY_OF) {
        let size = definition.size !== undefined ? definition.size : this.stream.readVarUint();

        item = [];

        while(size--) {
          item.push(this.unserializeItem(definition));
        }
      }
      else {
        item = this.unserializeItem(definition);
      }

      object[definition.name] = item;
    }
    return object;
  }

  /**
    Unserializes an item.
    @param {object} definition - The definition of the item.
  */
  unserializeItem(definition) {
    const mainType = definition.type & DATA.TYPE_MAIN;

    return (
      mainType == DATA.TYPE_OBJECT ?
        this.unserializeObject(definition.schema)
      :
        this.stream.readSchemaValue(mainType, definition.size)
    );
  }
}
