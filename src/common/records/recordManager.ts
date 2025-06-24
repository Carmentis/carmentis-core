import { SCHEMAS } from "../constants/constants.js";
import { SchemaValidator } from "../data/schemaValidator.js";
import { IntermediateRepresentation } from "./intermediateRepresentation.js";

export class RecordManager {
  constructor(object) {
    this.object = object;
    this.actors = new Map;
    this.channels = new Map;
  }

  async process() {
    const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
    validator.validate(this.object);

    this.forEach(this.object.actors, (def) => {
      this.addActor(def.name);
    });

    const authorId = this.getActorId(this.object.author);
    const ir = new IntermediateRepresentation;

    ir.buildFromJson(this.object.data);

    if(this.object.virtualBlockchainId) {
    }

    this.forEach(this.object.channels, (def) => {
      const channelId = this.addChannel(def.name);

      if(def.public) {
        ir.addPublicChannel(channelId);
      }
      else {
        ir.addPrivateChannel(channelId);
      }
    });

    this.forEach(this.object.fieldAssignations, (def) => {
      const channelId = this.getChannelId(def.channelName);
      ir.setChannel(def.fieldPath, channelId);
    });

    this.forEach(this.object.actorAssignations, (def) => {
      const channelId = this.getChannelId(def.channelName),
            actorId = this.getActorId(def.actorName);
    });

    this.forEach(this.object.hashableFields, (def) => {
      ir.setAsHashable(def.fieldPath);
    });

    this.forEach(this.object.maskableFields, (def) => {
      const list = def.maskedParts.map((obj) => [ obj.position, obj.position + obj.length, obj.replacementString ]);
      ir.setAsMaskable(def.fieldPath, list);
    });

    if(this.object.endorser) {
      const endorserId = this.getActorId(this.object.endorser);
    }

    ir.serializeFields();
    ir.populateChannels();
    console.log(ir.dumpIRObject());
  }

  addChannel(name) {
    if(this.channels.has(name)) {
      throw `channel '${name}' already exists`;
    }
    const id = this.channels.size + 1;
    this.channels.set(name, id);
    return id;
  }

  addActor(name) {
    if(this.actors.has(name)) {
      throw `actor '${name}' already exists`;
    }
    const id = this.actors.size + 1;
    this.actors.set(name, id);
    return id;
  }

  getChannelId(name) {
    if(!this.channels.has(name)) {
      throw `unknown channel '${name}'`;
    }
    return this.channels.get(name);
  }

  getActorId(name) {
    if(!this.actors.has(name)) {
      throw `unknown actor '${name}'`;
    }
    return this.actors.get(name);
  }

  forEach(array, callback) {
    for(const object of (array || [])) {
      callback(object);
    }
  }
}
