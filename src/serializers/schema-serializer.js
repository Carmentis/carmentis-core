import { DATA, SCHEMAS, ERRORS } from "../constants/constants.js";
import * as fieldSerializer from "./field-serializer.js";
import * as fieldMerklizer from "./field-merklizer.js";
import * as uint8 from "../util/uint8.js";
import { schemaError } from "../errors/error.js";

// ============================================================================================================================ //
//  encodeMessage()                                                                                                             //
// ============================================================================================================================ //
export function encodeMessage(id, object) {
  return encode(
    SCHEMAS.MESSAGES[id],
    object,
    {
      header: id
    }
  );
}

// ============================================================================================================================ //
//  decodeMessage()                                                                                                             //
// ============================================================================================================================ //
export function decodeMessage(array) {
  let id = array[0];

  let object = decode(
    SCHEMAS.MESSAGES[id],
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
  context.structures = context.structures || [];

  let stream = fieldSerializer.getWriteStream(),
      missingCounter = 8,
      missingPointer,
      missingMask,
      index = 0;

  let merkle;

  if(context.header != undefined) {
    stream.writeUnsigned(context.header, 1);
  }

  if(context.merklize) {
    merkle = fieldMerklizer.initialize();
    context.merklePepper = merkle.pepper;
  }

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  encodeNode()                                                                                                              //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function encodeNode(def, node, path, referenceNode) {
    if(def.condition && !def.condition(referenceNode)) {
      return;
    }

    let name = path.join(".");

    let isMissing = node === undefined;

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
      if(isMissing) {
        return;
      }
    }

    if(isMissing) {
      throw new schemaError(ERRORS.SCHEMA_UNDEFINED_FIELD, name);
    }

    if(def.type & DATA.ARRAY) {
      if(def.size == undefined) {
        stream.writeVarUint(node.length);
      }

      let innerDef = { ...def },
          indexBak = index;

      innerDef.type &= ~DATA.ARRAY;

      for(let i in node) {
        index = indexBak;
        encodeNode(innerDef, node[i], [ ...path, i ], referenceNode);
      }
    }
    else if(def.type & DATA.STRUCT) {
      encodeSchema(context.structures[def.type & DATA.MSK_META_ID].properties, node, path);
    }
    else if(def.type == DATA.OBJECT) {
      encodeSchema(def.schema, node, path);
    }
    else {
      if(checkFieldAccess(context, index)) {
        if(def.type & DATA.ENUM) {
          encodeEnumeration(def, node, name);
        }
        else {
          stream.encode(def, node, name);
        }
        if(context.merklize) {
          merkle.add(stream.getLastFieldData());
        }
      }
      index++;
    }
  }

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  encodeEnumeration()                                                                                                       //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function encodeEnumeration(def, node, name) {
    if(typeof node != "string") {
      throw new schemaError(ERRORS.SCHEMA_BAD_ENUM, name);
    }

    let enumerationId = def.type & DATA.MSK_META_ID,
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

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  encodeSchema()                                                                                                            //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function encodeSchema(schema, node, path = []) {
    for(let def of schema) {
      encodeNode(def, node[def.name], [ ...path, def.name ], node);
    }
  }

  encodeSchema(schema, object);

  if(context.merklize) {
    context.merkleData = merkle.generate();
    context.merkleRootHash = uint8.toHexa(context.merkleData.slice(4, 36));
  }

  return stream.getContent();
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
export function decode(schema, array, context = {}, object = {}) {
  context.ptr = context.ptr || 0;
  context.enumerations = context.enumerations || [];
  context.structures = context.structures || [];

  let stream = fieldSerializer.getReadStream(array, { ptr: context.ptr }),
      missingCounter = 8,
      missingMask,
      index = 0;

  let merkle;

  if(context.merklize) {
    merkle = fieldMerklizer.initialize(context.merklePepper);
  }

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  decodeNode()                                                                                                              //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function decodeNode(def, path, referenceNode, parentNode, propertyName) {
    let node = null;

    if(def.condition && !def.condition(referenceNode)) {
      return;
    }

    if(def.type & DATA.OPTIONAL) {
      if(missingCounter == 8) {
        missingMask = stream.readUnsigned(1);
        missingCounter = 0;
      }
      if(missingMask >> missingCounter++ & 1) {
        return;
      }
    }

    if(def.type & DATA.ARRAY) {
      let size = def.size == undefined ? stream.readVarUint() : def.size,
          innerDef = { ...def };

      innerDef.type &= ~DATA.ARRAY;
      node = parentNode[propertyName] || [];

      let indexBak = index;

      for(let i = 0; i < size; i++) {
        index = indexBak;
        decodeNode(innerDef, [ ...path, i ], referenceNode, node, i);
      }
    }
    else if(def.type & DATA.STRUCT) {
      node = parentNode[propertyName] || {};
      decodeSchema(context.structures[def.type & DATA.MSK_META_ID].properties, node, path);
    }
    else if(def.type == DATA.OBJECT) {
      node = parentNode[propertyName] || {};
      decodeSchema(def.schema, node, path);
    }
    else {
      if(checkFieldAccess(context, index)) {
        if(def.type & DATA.ENUM) {
          node = decodeEnumeration(def);
        }
        else {
          node = stream.decode(def, path.join("."));
        }
        if(context.merklize) {
          merkle.add(stream.getLastFieldData());
        }
      }
      index++;
    }

    if(parentNode[propertyName] === undefined || parentNode[propertyName] === null) {
      parentNode[propertyName] = node;
    }
  }

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  decodeEnumeration()                                                                                                       //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function decodeEnumeration(def) {
    let ndx = stream.decode({ type: DATA.UINT8 });

    return context.enumerations[def.type & DATA.MSK_META_ID].values[ndx];
  }

  // -------------------------------------------------------------------------------------------------------------------------- //
  //  decodeSchema()                                                                                                            //
  // -------------------------------------------------------------------------------------------------------------------------- //
  function decodeSchema(schema, node, path = []) {
    for(let def of schema) {
      decodeNode(def, [ ...path, def.name ], node, node, def.name);
    }
  }

  decodeSchema(schema, object);

  if(stream.getPointer() != array.length) {
console.log(stream, stream.getPointer(), array, array.length);
    throw new schemaError(ERRORS.SCHEMA_INVALID_STREAM, stream.getPointer(), array.length);
  }

  if(context.merklize) {
    context.merkleData = merkle.generate();
    context.merkleRootHash = uint8.toHexa(context.merkleData.slice(4, 36));
  }

  return object;
}

// ============================================================================================================================ //
//  checkFieldAccess()                                                                                                          //
// ============================================================================================================================ //
function checkFieldAccess(context, index) {
  return !context.flattenedFields || context.flattenedFields[index].subId == context.subId;
}
