import { WriteStream, ReadStream } from "./byteStreams.js";
import { DATA } from "./constants/constants.js";

class TypeChecker {
  /**
    Constructor
    @param {number} type
    @param {string} name
    @param {} value
  */
  constructor(type, name, value) {
    this.type = type;
    this.name = name;
    this.value = value;
  }

  /**
    Tests whether this.value conforms to this.type.
  */
  check() {
    switch(this.type) {
      case DATA.TYPE_STRING : { this.isString(); break; }
      case DATA.TYPE_NUMBER : { this.isNumber(); break; }
      case DATA.TYPE_BOOLEAN: { this.isBoolean(); break; }
      case DATA.TYPE_UINT8  : { this.isUnsignedInteger(8); break; }
      case DATA.TYPE_UINT16 : { this.isUnsignedInteger(16); break; }
      case DATA.TYPE_UINT24 : { this.isUnsignedInteger(24); break; }
      case DATA.TYPE_UINT32 : { this.isUnsignedInteger(32); break; }
      case DATA.TYPE_UINT48 : { this.isUnsignedInteger(48); break; }

      default: {
        throw `Unexpected type ${this.type}`;
      }
    }
  }

  isString() {
    if(typeof this.value != "string") {
      throw `'${this.name}' is not a string`;
    }
  }

  isNumber() {
    if(typeof this.value != "number") {
      throw `'${this.name}' is not a number`;
    }
  }

  isBoolean() {
    if(typeof this.value != "boolean") {
      throw `'${this.name}' is not a Boolean value`;
    }
  }

  isInteger() {
    this.isNumber();

    if(this.value % 1) {
      throw `'${this.name}' is not an integer`;
    }
    if(this.value < Number.MIN_SAFE_INTEGER || this.value > Number.MAX_SAFE_INTEGER) {
      throw `'${this.name}' is outside the safe integer range`;
    }
  }

  isUnsignedInteger(nBits) {
    this.isInteger();

    if(this.value < 0) {
      throw `'${this.name}' is not positive`;
    }
    if(this.value >= 2 ** nBits) {
      throw `'${this.name}' is too big (${nBits}-bit value expected)`;
    }
  }
}

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

    return this.stream.getContent();
  }

  /**
    Serializes any sub-object of the full structure.
    @param {Array} schema - The (sub)schema of the object.
    @param {object} object - The object to be serialized.
  */
  serializeObject(schema, object) {
    for(const definition of schema) {
      const value = object[definition.name];

      if(value === undefined) {
        throw `field '${definition.name}' is missing`;
      }

      if(definition.type & DATA.TYPE_ARRAY_OF) {
        if(!Array.isArray(value)) {
          throw `'${definition.name}' is not an array`;
        }

        if(definition.size !== undefined) {
          if(value.length != definition.size) {
            throw `invalid size for '${definition.name}' (expecting ${definition.size} entries, got ${value.length})`;
          }
        }
        else {
          this.stream.writeVarUint(value.length);
        }

        for(const entry of value) {
          this.serializeItem(definition, entry);
        }
      }
      else {
        this.serializeItem(definition, value);
      }
    }
  }

  /**
    Serializes an item.
    @param {object} definition - The definition of the item.
    @param {} value - The value of the item.
  */
  serializeItem(definition, value) {
    const mainType = definition.type & DATA.TYPE_MAIN;

    if(mainType == DATA.TYPE_OBJECT) {
      if(typeof value != "object" || value === null || !Object.getPrototypeOf(value).isPrototypeOf(Object)) {
        throw `'${definition.name}' is not an object`;
      }
      this.serializeObject(definition.schema, value);
    }
    else {
      const typeChecker = new TypeChecker(mainType, definition.name, value);

      typeChecker.check();
      this.stream.write(mainType, value);
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
        let size = definition.size !== undefined ? definition.size : stream.readVarUint();

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
        this.stream.read(mainType)
    );
  }
}
