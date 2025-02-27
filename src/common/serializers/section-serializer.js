import { ERRORS, ID, DATA, SECTIONS, SCHEMAS } from "../constants/constants.js";
import * as crypto from "../crypto/crypto.js";
import * as util from "../util/util.js";
import * as uint8 from "../util/uint8.js";
import * as access from "../apps/access.js";
import * as schemaSerializer from "./schema-serializer.js";
import * as structure from "../apps/structure.js";
import { sectionError } from "../errors/error.js";

// ============================================================================================================================ //
//  encode()                                                                                                                    //
// ============================================================================================================================ //
export async function encode(height, sectionNdx, vbType, sectionObject, keyManager, externalDef, schemaInfo) {
  let sectionDef = getSectionDefinition(vbType, sectionObject.id, externalDef);

  let section = {
    id: sectionObject.id,
    schemaInfo: schemaInfo,
    subsections: []
  };

  let ruleSets = access.getRuleSets(sectionDef);

  let flattenedFields = getFlattenedFields(sectionDef, ruleSets);

  let context = {
    flattenedFields: flattenedFields.list
  };

  if(externalDef) {
    context.structures = externalDef.structures;
    context.enumerations = externalDef.enumerations;
  }

  let subsectionNdx = 0;

  if(flattenedFields.hasPublicData) {
    context.subId = 0;

    let serializedData = schemaSerializer.encode(sectionDef.fields, sectionObject.object, context);

    let subsection = {
      type: 0,
      data: serializedData
    };

    section.subsections.push(subsection);
    subsectionNdx++;
  }

  for(let rule of ruleSets) {
    let ruleType = rule.subId >> 16,
        keyId = rule.subId & 0xFFFF,
        isProvable = !!(ruleType & DATA.SUB_PROVABLE),
        hasAccessRules = !!(ruleType & DATA.SUB_ACCESS_RULES);

    let key = await keyManager(keyId & 0xFF00, keyId & 0x00FF, sectionObject.object);

    if(!key) {
      throw new sectionError(ERRORS.SECTION_KEY_NOT_FOUND, util.hexa(keyId, 4));
    }

    let subsection = {
      type : ruleType,
      keyId: keyId
    };

    context.subId = rule.subId;
    context.merklize = isProvable;

    let paddingSize = crypto.getRandomInteger(8),
        padding = crypto.getRandomBytes(paddingSize),
        serializedData = schemaSerializer.encode(sectionDef.fields, sectionObject.object, context);

    let dataObject = {
      padding: padding,
      data   : serializedData
    };

    if(isProvable) {
      dataObject.merklePepper = context.merklePepper;
      subsection.merkleRootHash = context.merkleRootHash;
    }

    if(hasAccessRules) {
      subsection.accessRules = rule.accessRules;
    }

    let dataSchema = isProvable ? SCHEMAS.PROVABLE_DATA : SCHEMAS.PRIVATE_DATA,
        plainTextData = schemaSerializer.encode(dataSchema, dataObject),
        [ subKey, subIv ] = getSubKey(key, height, sectionNdx, subsectionNdx);

    let encryptedData = crypto.aes.encryptGcm(subKey, plainTextData, subIv);

    subsection.data = encryptedData;
    section.subsections.push(subsection);
    subsectionNdx++;
  }

  return section;
}

// ============================================================================================================================ //
//  decode()                                                                                                                    //
// ============================================================================================================================ //
export async function decode(height, sectionNdx, vbType, section, keyManager, externalDef) {
  let sectionDef = getSectionDefinition(vbType, section.id, externalDef);

  let ruleSets;

  if(section.id & DATA.EXTERNAL_SCHEMA) {
    ruleSets = getRuleSetsFromSection(section);
  }
  else {
    ruleSets = access.getRuleSets(sectionDef);
  }

  let flattenedFields = getFlattenedFields(sectionDef, ruleSets);

  let context = {
    flattenedFields: flattenedFields.list
  };

  if(externalDef) {
    context.structures = externalDef.structures;
    context.enumerations = externalDef.enumerations;
  }

  let object = {};

  for(let subsectionNdx in section.subsections) {
    subsectionNdx = +subsectionNdx;

    let subsection = section.subsections[subsectionNdx];

    let isPrivate = !!(subsection.type & DATA.SUB_PRIVATE),
        isProvable = !!(subsection.type & DATA.SUB_PROVABLE),
        hasAccessRules = !!(subsection.type & DATA.SUB_ACCESS_RULES),
        keyId = subsection.keyId,
        subId = subsection.type << 16 | keyId;

    let serializedData;

    if(isPrivate) {
      let key = await keyManager(keyId & 0xFF00, keyId & 0x00FF, object);

      if(!key) {
        continue;
      }

      let [ subKey, subIv ] = getSubKey(key, height, sectionNdx, subsectionNdx);

      let plainTextData = crypto.aes.decryptGcm(subKey, subsection.data, subIv);

      let dataSchema = isProvable ? SCHEMAS.PROVABLE_DATA : SCHEMAS.PRIVATE_DATA,
          dataObject = schemaSerializer.decode(dataSchema, plainTextData);

      serializedData = dataObject.data;
      context.merklePepper = dataObject.merklePepper;
    }
    else {
      serializedData = subsection.data;
    }

    context.subId = subId;
    context.merklize = isProvable;

    schemaSerializer.decode(sectionDef.fields, serializedData, context, object);

    if(isProvable) {
      if(context.merkleRootHash != subsection.merkleRootHash) {
        throw new sectionError(ERRORS.SECTION_BAD_MERKLE_HASH, util.hexa(subId), subsection.merkleRootHash, context.merkleRootHash);
      }
    }
  }

  return {
    id: section.id,
    object: object
  };
}

// ============================================================================================================================ //
//  getSubKey()                                                                                                                 //
// ============================================================================================================================ //
function getSubKey(key, height, sectionNdx, subsectionNdx) {
  let info = uint8.from(
    crypto.derive.PREFIX_SUBSECTION_KEY,
    util.intToByteArray(height, 6),
    sectionNdx,
    subsectionNdx
  );

  let subKey = uint8.toHexa(crypto.derive.deriveBitsFromKey(key, info, 256));

  info[0] = crypto.derive.PREFIX_SUBSECTION_IV;

  let subIv = crypto.derive.deriveBitsFromKey(key, info, 128);

  return [ subKey, subIv ];
}

// ============================================================================================================================ //
//  getSectionDefinition()                                                                                                      //
// ============================================================================================================================ //
function getSectionDefinition(vbType, sectionId, externalDef) {
  if(!SECTIONS.DEF[vbType]) {
    throw new sectionError(ERRORS.SECTION_INVALID_OBJECT_ID, vbType);
  }

  let sectionDef = { ...SECTIONS.DEF[vbType][sectionId] };

  if(!sectionDef) {
    throw new sectionError(ERRORS.SECTION_INVALID_ID, sectionId, ID.OBJECT_NAME[vbType]);
  }

  if(sectionId & DATA.EXTERNAL_SCHEMA) {
    if(!externalDef) {
      throw new sectionError(ERRORS.SECTION_NO_EXTERNAL_DEF, sectionId);
    }
    sectionDef = { ...sectionDef, ...externalDef };
  }
  else {
    sectionDef.subsections = sectionDef.subsections || [];
  }

  return sectionDef;
}

// ============================================================================================================================ //
//  getRuleSetsFromSection()                                                                                                    //
// ============================================================================================================================ //
function getRuleSetsFromSection(section) {
  let ruleSets = [];

  section.subsections.forEach(subsection => {
    if(subsection.type & DATA.SUB_ACCESS_RULES) {
      ruleSets.push({
        subId: subsection.type << 16 | subsection.keyId,
        accessRules: subsection.accessRules
      });
    }
  });

  return ruleSets;
}

// ============================================================================================================================ //
//  getFlattenedFields()                                                                                                        //
// ============================================================================================================================ //
function getFlattenedFields(def, ruleSets) {
  let list = [],
      hasPublicData = 0;

  function scanFields(collection, path = [], name = []) {
    collection.forEach((item, id) => {
      let newPath = [...path, id],
          newName = [...name, item.name];

      if(item.type & DATA.STRUCT) {
        scanFields(structure.getCollection(def, item), newPath, newName);
      }
      else if(!(item.type & DATA.ENUM) && (item.type & DATA.MSK_PRIMITIVE_TYPE) == DATA.OBJECT) {
        scanFields(item.schema, newPath, newName);
      }
      else {
        let isPublic = !(item.type & DATA.PRIVATE),
            [ subId, modifiers ] = getSubsection(newPath, isPublic, ruleSets);

        hasPublicData |= isPublic;

        list.push({
          name: newName.join("."),
          path: newPath,
          subId: subId,
          modifiers: modifiers
        });
      }
    });
  }

  scanFields(def.fields);

  return {
    list: list,
    hasPublicData: hasPublicData
  };
}

// ============================================================================================================================ //
//  getSubsection()                                                                                                             //
// ============================================================================================================================ //
function getSubsection(fieldPath, isPublic, ruleSets) {
  let subId = isPublic ? 0 : -1,
      modifiers = DATA.PLAIN,
      level = 0;

  ruleSets.forEach(rule => {
    rule.accessRules.forEach(object => {
      let depth = object.path.length,
          wildcard = object.path[depth - 1] == DATA.WILDCARD;

      if(wildcard) {
        if(!isPublic && fieldPath.length >= depth && object.path.slice(0, -1).every((v, i) => v == fieldPath[i])) {
          if(depth > level) {
            subId = rule.subId;
            modifiers = object.modifiers;
            level = depth;
          }
        }
      }
      else if(fieldPath.length == depth && object.path.every((v, i) => v == fieldPath[i])) {
        if(isPublic) {
          throw new sectionError(ERRORS.SECTION_PUBLIC_TO_PRIVATE, object.name);
        }
        subId = rule.subId;
        modifiers = object.modifiers;
        level = Infinity;
      }
    });
  });

  return [ subId, modifiers ];
}
