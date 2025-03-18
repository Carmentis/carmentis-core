import { DATA, SECTIONS } from "../constants/constants.js";
import * as appDefinition from "./definition.js";
import { schemaIterator } from "../serializers/schema.js";
import * as util from "../util/util.js";

// ============================================================================================================================ //
//  getRecord()                                                                                                                 //
// ============================================================================================================================ //
export function getRecord(vb, height) {
  let mb = vb.getMicroblock(height),
      record = mb.findSection(SECTIONS.APP_LEDGER_CHANNEL_DATA);

  return record;
}

// ============================================================================================================================ //
//  flattenRecord()                                                                                                             //
// ============================================================================================================================ //
export function flattenRecord(vb, record) {
  let definition = vb.appDef.definition,
      arr = [];

  function parse(schema, node, name = [], path = []) {
    if(node === null || typeof node != "object") {
      return;
    }

    Object.keys(node).forEach((key, ndx) => {
      let value = node[key],
          newName = [...name, key],
          newPath = [...path, ndx],
          def = schema.find(o => o.name == key);

      if(def.type & DATA.ARRAY) {
        arr.push({ name: newName.join("."), path: newPath, def: def, value: value });
      }
      else if(def.type & DATA.STRUCT) {
        parse(appDefinition.getSchema(definition, def), value, newName, newPath);
      }
      else {
        arr.push({ name: newName.join("."), path: newPath, def: def, value: value });
      }
    });
  }

  parse(definition.fields, record);

/*
  let arr0 = [];
  let iterator = new schemaIterator(definition.fields);

  iterator.iterate({
    internalStructures: definition.internalStructures,

    onLeaf: (def, nodeContext) => {
      let value = schemaIterator.readObject(record, nodeContext);

      arr0.push({
        name: schemaIterator.getNodeName(nodeContext.namePath),
        path: nodeContext.indexPath,
        def: def,
        value: value
      });
    }
  });

  if(JSON.stringify(arr) != JSON.stringify(arr0)) {
    console.log(JSON.stringify(arr));
    console.log(JSON.stringify(arr0));
  }
*/
  return arr;
}

// ============================================================================================================================ //
//  getApprovalMessage()                                                                                                        //
// ============================================================================================================================ //
export function getApprovalMessage(vb, height) {
  let mb = vb.getMicroblock(height),
      endorserSection = mb.findSection(SECTIONS.APP_LEDGER_ENDORSER),
      messageDef = vb.appDef.definition.messages[endorserSection.messageId],
      fields = [];

  for(let ndx in messageDef.fields) {
    let field = messageDef.fields[ndx],
        minRewind = DATA.REF_MIN_REWIND[field.type],
        maxRewind = DATA.REF_MAX_REWIND[field.type],
        found = false;

    for(let rewind = minRewind; rewind <= maxRewind; rewind++) {
      let record = getRecord(vb, height - rewind),
          flatRecord = flattenRecord(vb, record);

      let match = flatRecord.find(obj =>
        obj.name == field.name
/*
        util.arraysAreEqual(obj.path, field.path)
*/
      );

      if(match) {
        fields.push({ ...match, height: height - rewind });
        found = true;
        break;
      }
    }
    if(!found) {
      console.log(messageDef);
      throw `Field not found`;
    }
  }

  let parts = [];

  for(let n = 0; n < Math.max(messageDef.texts.length, messageDef.fields.length); n++) {
    if(messageDef.texts[n]) {
      parts.push({
        isField: false,
        value: messageDef.texts[n]
      });
    }
    if(messageDef.fields[n]) {
      parts.push({
        isField: true,
        field  : fields[n].name,
        def    : fields[n].def,
        value  : fields[n].value,
        height : fields[n].height
      });
    }
  }

  return parts;
}
