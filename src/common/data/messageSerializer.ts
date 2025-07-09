import { DATA } from "../constants/constants";
import { SchemaSerializer, SchemaUnserializer } from "./schemaSerializer";

export class MessageSerializer<T = any> {
  collection: any;
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection: any) {
    this.collection = collection;
  }

  /**
    Serializes the given message.
    @param {number} type - Message type
    @param {object} object - The message object to be serialized
  */
  serialize(type: any, object: T) {
    const schema = [
      { name: "__msgType", type: DATA.TYPE_UINT8 },
      ...this.collection[type]
    ];

    const serializer = new SchemaSerializer(schema);
    const data = serializer.serialize({ __msgType: type, ...object });

    return data;
  }
}

export class MessageUnserializer<T = object> {
  collection: any;
  /**
    Constructor
    @param {Array} collection - Message collection
  */
  constructor(collection: any) {
    this.collection = collection;
  }

  /**
    Unserializes the given message byte stream.
    @param {Uint8Array} stream - The serialized byte stream
  */
  unserialize(stream: Uint8Array) {
    const type = stream[0];

    const schema = [
      { name: "__msgType", type: DATA.TYPE_UINT8 },
      ...this.collection[type]
    ];

    const unserializer = new SchemaUnserializer(schema);
    const object = unserializer.unserialize(stream);
    // @ts-expect-error TS(2339): Property '__msgType' does not exist on type '{}'.
    delete object.__msgType;

    return { type, object: object as T };
  }
}
