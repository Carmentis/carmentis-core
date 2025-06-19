import { Level } from "level";
import { NODE_SCHEMAS } from "./node-constants.js";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer.js";

export class LevelDb {
  constructor(path, tableSchemas) {
    this.path = path;
    this.tableSchemas = tableSchemas;
  }

  async open() {
    const encoding = {
      keyEncoding: "view",
      valueEncoding: "view"
    };

    this.db = new Level(this.path, encoding);
    this.sub = [];

    const nTables = Object.keys(this.tableSchemas).length;

    for(let n = 0; n < nTables; n++) {
      this.sub[n] = this.db.sublevel("SUB" + n, encoding);
    }
  }

  close() {
    this.db.close();
  }

  async getRaw(tableId, key) {
    try {
      const b = await this.sub[tableId].get(key);
      return new Uint8Array(b.buffer.slice(b.byteOffset, b.byteOffset + b.byteLength));
    }
    catch(e) {
      if(!e.notFound) {
        console.error(e);
      }
      return null;
    }
  }

  async getObject(tableId, key) {
    const data = await this.getRaw(tableId, key);

    if(!data) {
      return null;
    }

    const unserializer = new SchemaUnserializer(NODE_SCHEMAS.DB[tableId]);
    return unserializer.unserialize(data);
  }

  async putRaw(tableId, key, data) {
    try {
      await this.sub[tableId].put(key, data);
      return true;
    }
    catch(e) {
      console.error(e);
      return false;
    }
  }

  async putObject(tableId, key, object) {
    const serializer = new SchemaSerializer(NODE_SCHEMAS.DB[tableId]);
    const data = serializer.serialize(object);

    return await this.putRaw(tableId, key, data);
  }

  async del(tableId, key) {
    try {
      await this.db.sub[tableId].del(key);
      return true;
    }
    catch(e) {
      console.error(e);
      return false;
    }
  }
}
