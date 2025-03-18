import { DATA, SCHEMAS, ERRORS } from "../constants/constants.js";
import { schemaIterator } from "./schema.js";
import * as fieldSerializer from "./field-serializer.js";
import { fieldMerklizer } from "../proofs/field-merklizer.js";
import * as uint8 from "../util/uint8.js";
import * as util from "../util/util.js";
import * as appDefinition from "../apps/definition.js";
import { schemaError } from "../errors/error.js";

// ============================================================================================================================ //
//  encodeMessage()                                                                                                             //
// ============================================================================================================================ //
export function encodeMessage(id, object, schemas) {
  return encode(
    schemas[id],
    object,
    {
      header: id
    }
  );
}

// ============================================================================================================================ //
//  decodeMessage()                                                                                                             //
// ============================================================================================================================ //
export function decodeMessage(array, schemas) {
  let id = array[0];

  let object = decode(
    schemas[id],
    array,
    {
      ptr: 1
    }
  );

  return [ id, object ];
}

// ============================================================================================================================ //
//  encode()                                                                                                                    //
// ============================================================================================================================ //
export function encode(schema, object, context = {}) {
  if(!object || typeof object != "object") {
    throw new schemaError(ERRORS.SCHEMA_CANNOT_ENCODE);
  }

  context.enumerations = context.enumerations || [];
  context.internalStructures = context.internalStructures || [];

  let stream = fieldSerializer.getWriteStream(),
      missingCounter = 8,
      missingPointer,
      missingMask;

  if(context.header !== undefined) {
    stream.writeUnsigned(context.header, 1);
  }

  let merklizer;

  if(context.merklize) {
    merklizer = new fieldMerklizer();
    context.merklePepper = merklizer.getPepper();
  }

  let iterator = new schemaIterator(schema);

  iterator.iterate({
    internalStructures: context.internalStructures,

    onEnterNode: (def, nodeContext) => {
      if(!checkFieldCondition(def, object, nodeContext)) {
        return false;
      }

      if(!checkFieldAccess(context, nodeContext)) {
        return false;
      }

      let item = schemaIterator.readObject(object, nodeContext),
          isMissing = item === undefined;

      if(def.type & DATA.OPTIONAL) {
        if(missingCounter == 8) {
          missingPointer = stream.getPointer();
          missingCounter = 1;
          missingMask = isMissing;
          stream.writeUnsigned(missingMask, 1);
        }
        else {
          missingMask |= isMissing << missingCounter++;
          stream.setByte(missingPointer, missingMask);
        }
        if(context.merklize && isMissing) {
          merklizer.addUndefined(nodeContext.indexPath);
        }
      }
      else if(isMissing) {
        throw new schemaError(ERRORS.SCHEMA_UNDEFINED_FIELD, nodeContext.namePath);
      }

      return !isMissing;
    },

    onEnterArray: (def, nodeContext) => {
      let item = schemaIterator.readObject(object, nodeContext);

      if(context.merklize) {
        let arrayStream = fieldSerializer.getWriteStream();

        if(def.size == undefined) {
          arrayStream.writeVarUint(item.length);
        }
        nodeContext.array = arrayStream.getContent();
      }

      if(def.size == undefined) {
        stream.writeVarUint(item.length);
      }
      return item.length;
    },

    onLeaveArray: (def, nodeContext) => {
      if(context.merklize) {
        merklizer.add(nodeContext.array, nodeContext.indexPath);
      }
    },

    onEnterStructure: (def, nodeContext) => {
      if(context.merklize) {
        merklizer.enterSubTree(nodeContext.indexPath);
      }
    },

    onLeaveStructure: (def, nodeContext) => {
      if(context.merklize) {
        merklizer.leaveSubTree();
      }
    },

    onLeaf: (def, nodeContext) => {
      let item = schemaIterator.readObject(object, nodeContext);

      if(def.type & DATA.ENUM) {
        encodeEnumeration(context, stream, def, item, nodeContext.namePath);
      }
      else {
        stream.encode(def, item, nodeContext.namePath);
      }

      if(context.merklize) {
        merklizeLeaf(stream, merklizer, nodeContext);
      }
    }
  });

  if(context.merklize) {
    context.treeData = merklizer.generate();
    context.merkleRootHash = uint8.toHexa(context.treeData.hash);
    console.log("encode/merkleRootHash", context.merkleRootHash);
  }

  return stream.getContent();
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
export function decode(schema, array, context = {}, object = {}) {
  context.enumerations = context.enumerations || [];
  context.internalStructures = context.internalStructures || [];

  let stream = fieldSerializer.getReadStream(array, { ptr: context.ptr || 0 }),
      missingCounter = 8,
      missingMask;

  let merklizer, leafArray = [];

  if(context.merklize) {
    merklizer = new fieldMerklizer(context.merklePepper, leafArray);
  }

  let iterator = new schemaIterator(schema);

  iterator.iterate({
    internalStructures: context.internalStructures,

    onEnterNode: (def, nodeContext) => {
      if(!checkFieldCondition(def, object, nodeContext)) {
        return false;
      }

      if(!checkFieldAccess(context, nodeContext)) {
        return false;
      }

      if(def.type & DATA.OPTIONAL) {
        if(missingCounter == 8) {
          missingMask = stream.readUnsigned(1);
          missingCounter = 0;
        }

        let isMissing = missingMask >> missingCounter++ & 1;

        if(context.merklize && isMissing) {
          merklizer.addUndefined(nodeContext.indexPath);
        }

        return !isMissing;
      }

      return true;
    },

    onEnterArray: (def, nodeContext) => {
      schemaIterator.writeObject(object, nodeContext, []);

      let size = def.size == undefined ? stream.readVarUint() : def.size;

      if(context.merklize) {
        let arrayStream = fieldSerializer.getWriteStream();

        if(def.size == undefined) {
          arrayStream.writeVarUint(size);
        }
        nodeContext.array = arrayStream.getContent();
      }

      return size;
    },

    onLeaveArray: (def, nodeContext) => {
      if(context.merklize) {
        merklizer.add(nodeContext.array, nodeContext.indexPath);
      }
    },

    onEnterStructure: (def, nodeContext) => {
      schemaIterator.writeObject(object, nodeContext, {});

      if(context.merklize) {
        merklizer.enterSubTree(nodeContext.indexPath);
      }
    },

    onLeaveStructure: (def, nodeContext) => {
      if(context.merklize) {
        merklizer.leaveSubTree();
      }
    },

    onLeaf: (def, nodeContext) => {
      let item;

      if(def.type & DATA.ENUM) {
        item = decodeEnumeration(context, stream, def);
      }
      else {
        item = stream.decode(def);
      }

      schemaIterator.writeObject(object, nodeContext, item);

      if(context.merklize) {
        merklizeLeaf(stream, merklizer, nodeContext);
      }
    }
  });

  if(stream.getPointer() != array.length) {
    throw new schemaError(ERRORS.SCHEMA_INVALID_STREAM, stream.getPointer(), array.length);
  }

  if(context.merklize) {
    context.treeData = merklizer.generate();
    context.merkleRootHash = uint8.toHexa(context.treeData.hash);
    console.log("decode/merkleRootHash", context.merkleRootHash);
  }

  return object;
}

// ============================================================================================================================ //
//  decodeFromProof()                                                                                                           //
// ============================================================================================================================ //
export function decodeFromProof(schema, array, context = {}, object = {}) {
  context.enumerations = context.enumerations || [];
  context.internalStructures = context.internalStructures || [];

  let stream = fieldSerializer.getReadStream(array, { ptr: context.ptr || 0 });

  let iterator = new schemaIterator(schema);

  iterator.iterate({
    internalStructures: context.internalStructures,

    onEnterNode: (def, nodeContext) => {
      if(!checkFieldCondition(def, object, nodeContext)) {
        return false;
      }

      if(!checkFieldAccess(context, nodeContext)) {
        return false;
      }

      let mode = stream.readUnsigned(1);

      if((mode & DATA.MSK_ACCESS) == DATA.REDACTED) {
        schemaIterator.writeObject(object, nodeContext, null);
        return false;
      }

      if(def.type & DATA.OPTIONAL) {
        return !(mode & DATA.MISSING);
      }

      return true;
    },

    onEnterArray: (def, nodeContext) => {
      schemaIterator.writeObject(object, nodeContext, []);

      let size = def.size == undefined ? stream.readVarUint() : def.size;

      return size;
    },

    onLeaveArray: (def, nodeContext) => {
    },

    onEnterStructure: (def, nodeContext) => {
      schemaIterator.writeObject(object, nodeContext, {});
    },

    onLeaveStructure: (def, nodeContext) => {
    },

    onLeaf: (def, nodeContext) => {
      let item;

      if(def.type & DATA.ENUM) {
        item = decodeEnumeration(context, stream, def);
      }
      else {
        item = stream.decode(def);
      }

      schemaIterator.writeObject(object, nodeContext, item);
    }
  });

  if(stream.getPointer() != array.length) {
    throw new schemaError(ERRORS.SCHEMA_INVALID_STREAM, stream.getPointer(), array.length);
  }

  return object;
}

// ============================================================================================================================ //
//  encodeEnumeration()                                                                                                         //
// ============================================================================================================================ //
function encodeEnumeration(context, stream, def, node, name) {
  if(typeof node != "string") {
    throw new schemaError(ERRORS.SCHEMA_INVALID_ENUM, name);
  }

  let enumerationId = def.type & DATA.MSK_OBJECT_INDEX,
      enumeration = context.enumerations && context.enumerations[enumerationId];

  if(!enumeration) {
    throw new schemaError(ERRORS.SCHEMA_UNDEFINED_ENUM, enumerationId);
  }

  let ndx = enumeration.values.indexOf(node);

  if(ndx == -1) {
    throw new schemaError(ERRORS.SCHEMA_NOT_IN_ENUM, node, name, enumeration.name);
  }

  stream.encode({ type: DATA.UINT8 }, ndx, name);
}

// ============================================================================================================================ //
//  decodeEnumeration()                                                                                                         //
// ============================================================================================================================ //
function decodeEnumeration(context, stream, def) {
  let ndx = stream.decode({ type: DATA.UINT8 });

  return context.enumerations[def.type & DATA.MSK_OBJECT_INDEX].values[ndx];
}

// ============================================================================================================================ //
//  checkFieldCondition()                                                                                                       //
// ============================================================================================================================ //
function checkFieldCondition(def, object, nodeContext) {
  if(def.condition) {
    let parent = schemaIterator.readObject(object, nodeContext, 1);

    if(!def.condition(parent)) {
      return false;
    }
  }
  return true;
}

// ============================================================================================================================ //
//  checkFieldAccess()                                                                                                          //
// ============================================================================================================================ //
function checkFieldAccess(context, nodeContext) {
  if(!context.flattenedFields) {
    return true;
  }

  let flattenedField = context.flattenedFields.find(obj => util.arraysAreEqual(obj.path, nodeContext.indexPath));

  if(!flattenedField) {
    throw new schemaError(ERRORS.SCHEMA_NO_SUBSECTION, schemaIterator.getNodeName(nodeContext.namePath));
  }

  return flattenedField.subId.has(context.subId);
}

// ============================================================================================================================ //
//  merklizeLeaf()                                                                                                              //
// ============================================================================================================================ //
function merklizeLeaf(stream, merklizer, nodeContext) {
  let data = stream.getLastFieldData();

  if(nodeContext.inArray) {
    let newArray = new Uint8Array(nodeContext.array.length + data.length);

    newArray.set(nodeContext.array);
    newArray.set(data, nodeContext.array.length);

    nodeContext.array = newArray;
  }
  else {
    merklizer.add(data, nodeContext.indexPath);
  }
}
