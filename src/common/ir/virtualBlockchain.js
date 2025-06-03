import { SECTIONS } from "./constants/constants.js";
import { SchemaSerializer } from "./schemaSerializer.js";

export class VirtualBlockchain {
  constructor(type) {
    this.type = type;
  }

  async load(identifier) {
  }

  async addSection(type, object) {
    const sectionDef = SECTIONS.DEF[this.type][type],
          serializer = new SchemaSerializer(sectionDef.schema),
          data = serializer.serialize(object);

    console.log(data);
  }
}
