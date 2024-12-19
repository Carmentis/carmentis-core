import { ERRORS, DATA } from "../constants/constants.js";
import * as path from "./path.js";
import { pathError } from "../errors/error.js";

// ============================================================================================================================ //
//  encodeMessages()                                                                                                            //
// ============================================================================================================================ //
export function encodeMessages(appDef) {
  for(let msg of appDef.messages) {
    let [ texts, fields ] = encodeMessage(appDef, msg.content);

    msg.texts = texts;
    msg.fields = fields;

    delete msg.content;
  }
}

// ============================================================================================================================ //
//  decodeMessages()                                                                                                            //
// ============================================================================================================================ //
export function decodeMessages(appDef) {
  for(let msg of appDef.messages) {
    msg.content = decodeMessage(appDef, msg.texts, msg.fields);

    delete msg.texts;
    delete msg.fields;
  }
}

// ============================================================================================================================ //
//  encodeMessage()                                                                                                             //
// ============================================================================================================================ //
function encodeMessage(appDef, msg) {
  let texts = [],
      fields = [];

  msg.split(/(\{\{.+?\}\})/).forEach((part, ndx) => {
    if(ndx & 1) {
      fields.push(parseFieldReference(appDef, part.slice(2, -2).trim()))
    }
    else {
      texts.push(part);
    }
  });

  while(texts[texts.length - 1] == "") {
    texts.pop();
  }

  return [ texts, fields ];
}

// ============================================================================================================================ //
//  decodeMessage()                                                                                                             //
// ============================================================================================================================ //
function decodeMessage(appDef, texts, fields) {
  let parts = [];

  for(let n = 0; n < Math.max(texts.length, fields.length); n++) {
    parts.push(texts[n] || "");

    if(fields[n]) {
      parts.push(`{{${DATA.REF_NAME[fields[n].type] + "." + path.decode(appDef, fields[n].path)}}}`);
    }
  }

  return parts.join("");
}

// ============================================================================================================================ //
//  parseFieldReference()                                                                                                       //
// ============================================================================================================================ //
function parseFieldReference(appDef, fieldRef) {
  let m = fieldRef.match(/^(this|last|previous)\.((\w+)(\.\w+)*)$/);

  if(!m) {
    throw errorHeader + `invalid format`;
  }

  return {
    type: DATA.REF_NAME.indexOf(m[1]),
    path: path.encode(appDef, m[2], false)
  };
}
