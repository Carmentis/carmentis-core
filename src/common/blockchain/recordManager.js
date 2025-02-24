import { DATA, SECTIONS } from "../constants/constants.js";

export function getRecord(vb, height) {
  let mb = vb.getMicroblock(height),
      record = mb.findSection(SECTIONS.APP_LEDGER_CHANNEL_DATA);

  return record;
}

export function flattenRecord(vb, record) {
  let definition = vb.appDef.definition,
      arr = [];

  function parse(fieldDef, node, name = [], path = []) {
    Object.keys(node).forEach((key, ndx) => {
      let value = node[key],
          newName = [...name, key],
          newPath = [...path, ndx],
          def = fieldDef.find(o => o.name == key);

      if(def.type & DATA.ARRAY) {
        arr.push({ name: newName.join("."), path: newPath, def: def, value: value });
      }
      else if(def.type & DATA.STRUCT) {
        parse(definition.structures[def.type & DATA.MSK_OBJECT_INDEX].properties, value, newName, newPath);
      }
      else {
        arr.push({ name: newName.join("."), path: newPath, def: def, value: value });
      }
    });
  }

  parse(definition.fields, record);

  return arr;
}

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
        obj.path.length == field.path.length &&
        obj.path.every((v, i) => field.path[i] == v)
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
