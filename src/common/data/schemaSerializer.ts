import { DATA } from "../constants/constants";
import { WriteStream, ReadStream } from "./byteStreams";
import { TypeManager, TypeChecker } from "./types";

export class SchemaSerializer<T = any> {
  schema: any;
  stream: any;
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema: any) {
    this.schema = schema;
  }

  /**
    Serializes the given object.
    @param {object} object - The object to be serialized.
  */
  serialize(object: T): Uint8Array {
    this.stream = new WriteStream;
    this.serializeObject(this.schema, object);

    return this.stream.getByteStream();
  }

  /**
    Serializes any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
    @param {object} object - The object to be serialized.
  */
  serializeObject(schema: any, object: any, path = "") {
    for(const definition of schema) {
      const fieldPath = path + (path && ".") + definition.name,
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
  serializeItem(definition: any, value: any, fieldPath: any) {
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

export class SchemaUnserializer<T = object> {
  schema: any;
  stream: any;
  /**
    Constructor
    @param {Array} schema - Top-level schema
  */
  constructor(schema: any) {
    this.schema = schema;
  }

  /**
    Unserializes the given byte stream.
    @param {Uint8Array} stream - The serialized byte stream
  */
  unserialize(stream: any): T {
    this.stream = new ReadStream(stream);

    const object = this.unserializeObject(this.schema),
          pointer = this.stream.getPointer(),
          size = stream.length;

    if(pointer != size) {
      throw `Invalid stream length (decoded ${pointer} bytes, actual length is ${size} bytes)`;
    }

    return object as T;
  }

  /**
    Unserializes any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
  */
  protected unserializeObject(schema: any): object {
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

      // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
      object[definition.name] = item;
    }
    return object;
  }

  /**
    Unserializes an item.
    @param {object} definition - The definition of the item.
  */
  unserializeItem(definition: any) {
    const mainType = definition.type & DATA.TYPE_MAIN;

    return (
      mainType == DATA.TYPE_OBJECT ?
        this.unserializeObject(definition.schema)
      :
        this.stream.readSchemaValue(mainType, definition.size)
    );
  }
}
