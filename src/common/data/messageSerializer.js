import { DATA } from "../constants/constants.js";
import { SchemaSerializer, SchemaUnserializer } from "./schemaSerializer.js";

export class MessageSerializer {
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection) {
    this.collection = collection;
  }

  /**
    Serializes the given message.
    @param {number} type - Message type
    @param {object} object - The message object to be serialized
  */
  serialize(type, object) {
    const schema = [
      { name: "__msgType", type: DATA.TYPE_UINT8 },
      ...this.collection[type]
    ];

    const serializer = new SchemaSerializer(schema);
    const data = serializer.serialize({ __msgType: type, ...object });

    return data;
  }
}

export class MessageUnserializer {
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection) {
    this.collection = collection;
  }

  /**
    Unserializes the given message byte stream.
    @param {Uint8Array} stream - The serialized byte stream
  */
  unserialize(stream) {
    const type = stream[0];

    const schema = [
      { name: "__msgType", type: DATA.TYPE_UINT8 },
      ...this.collection[type]
    ];

    const unserializer = new SchemaUnserializer(schema);
    const object = unserializer.unserialize(stream);
    delete object.__msgType;

    return { type, object };
  }
}
