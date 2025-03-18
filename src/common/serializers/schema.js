import { DATA, ERRORS } from "../constants/constants.js";
import { schemaError } from "../errors/error.js";

export class schemaIterator {
  constructor(schema) {
    this.schema = schema;
  }

  iterate(options = {}) {
    const doNothing = _ => _;

    this.callbacks = {
      onEnterNode     : options.onEnterNode || (_ => true),
      onEnterStructure: options.onEnterStructure || doNothing,
      onLeaveStructure: options.onLeaveStructure || doNothing,
      onEnterArray    : options.onEnterArray || (_ => 1),
      onLeaveArray    : options.onLeaveArray || doNothing,
      onLeaf          : options.onLeaf || doNothing
    }

    this.structures = {
      internalStructures: Array.isArray(options.internalStructures) ? options.internalStructures : [],
      oracleStructures: Array.isArray(options.oracleStructures) ? options.oracleStructures : []
    };

    let nodeContext = {
      indexPath: [],
      namePath: [],
      parentNodeContext: null
    };

    this.processSchema(this.schema, nodeContext);
  }

  processSchema(schema, nodeContext) {
    for(let ndx = 0; ndx < schema.length; ndx++) {
      let def = schema[ndx];

      let newNodeContext = {
        indexPath: [ ...nodeContext.indexPath, ndx ],
        namePath: [ ...nodeContext.namePath, def.name ],
        parentNodeContext: nodeContext
      };

      this.processNode(def, newNodeContext);
    }
  }

  processNode(def, nodeContext) {
    if(!this.callbacks.onEnterNode(def, nodeContext)) {
      return;
    }

    if(def.type & DATA.ARRAY) {
      let size = this.callbacks.onEnterArray(def, nodeContext),
          pathNdx = nodeContext.indexPath.length;

      nodeContext.inArray = true;

      for(let index = 0; index < size; index++) {
        nodeContext.namePath.push(index);
        this.processNodeContent(def, nodeContext);
        nodeContext.namePath.pop();
      }
      nodeContext.inArray = false;
      this.callbacks.onLeaveArray(def, nodeContext);
    }
    else {
      this.processNodeContent(def, nodeContext);
    }
  }

  processNodeContent(def, nodeContext) {
    let structure = this.getStructure(def);

    if(structure) {
      this.callbacks.onEnterStructure(def, nodeContext);
      this.processSchema(structure, nodeContext);
      this.callbacks.onLeaveStructure(def, nodeContext);
    }
    else {
      this.callbacks.onLeaf(def, nodeContext);
    }
  }

  getStructure(def) {
    if(def.type & DATA.STRUCT) {
      switch(def.structType) {
        case DATA.STRUCT_INTERNAL: {
          return this.structures.internalStructures[def.type & DATA.MSK_OBJECT_INDEX].properties;
        }
        case DATA.STRUCT_ORACLE: {
          return null;
        }
        default: {
          throw `Internal error: invalid structure type ${def.structType}`;
        }
      }
    }
    if(!(def.type & DATA.MSK_HAS_INDEX) && (def.type & DATA.MSK_PRIMITIVE_TYPE) == DATA.OBJECT) {
      return def.schema;
    }
    return null;
  }

  static getNodeName(namePath) {
    return namePath.reduce((p, v, i) => p + (typeof v == "number" ? `[${v}]` : (p && ".") + v), "");
  }

  static readObject(object, nodeContext, ignored = 0) {
    let node = object;

    for(let i = 0; i < nodeContext.namePath.length - ignored; i++) {
      node = node && node[nodeContext.namePath[i]];
    }

    return node;
  }

  static writeObject(object, nodeContext, item) {
    if(!nodeContext.namePath.length) {
      return;
    }

    let node = object,
        propertyName = nodeContext.namePath[nodeContext.namePath.length - 1];

    for(let i = 0; i < nodeContext.namePath.length - 1; i++) {
      node = node && node[nodeContext.namePath[i]];
    }

    if(node[propertyName] === undefined || node[propertyName] === null) {
      node[propertyName] = item;
    }
  }
}
