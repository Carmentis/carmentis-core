import { DATA, ERRORS } from "../constants/constants.js";
import * as path from "./path.js";
import * as util from "../util/util.js";
import { pathError } from "../errors/error.js";

const REGEX_RULE = /(^\*|^(\w+)(\.\w+)*(\.\*)?)(:(\w+(\+\w+)*))?$/;

const MODIFIER = {
  "hashed": DATA.HASHED,
  "masked": DATA.MASKED
};

// ============================================================================================================================ //
//  getRuleSets()                                                                                                               //
// ============================================================================================================================ //
export function getRuleSets(sectionDef) {
  let subSet = new Set,
      rules = [];

  sectionDef.subsections.forEach(([ str, type, keyId, keyIndex0, keyIndex1 ]) => {
    let subId = (type << 24 | keyId << 16 | keyIndex0 << 8 | keyIndex1) >>> 0;

    if(subSet.has(subId)) {
      throw new pathError(ERRORS.PATH_DUPLICATE_RULE, util.hexa(subId, 5));
    }

    subSet.add(subId);

    let accessRules = parseRuleSet(sectionDef, str.split(","), false);

    rules.push({
      subId: subId,
      accessRules: accessRules
    });
  });

  rules.sort((a, b) => a.subId - b.subId);

  return rules;
}

// ============================================================================================================================ //
//  parseRuleSet()                                                                                                              //
// ============================================================================================================================ //
function parseRuleSet(sectionDef, ruleSet, allowModifiers = true) {
  let accessRules = [];

  ruleSet.forEach(rule => {
    let m = rule.trim().match(REGEX_RULE);

    if(!m) {
      throw new pathError(ERRORS.PATH_INVALID_RULE, rule);
    }

    let name = m[1],
        modifierList = m[6] ? m[6].split("+") : [],
        modifiers = DATA.PLAIN;

    modifierList.forEach(keyword => {
      let msk = MODIFIER[keyword];

      if(!msk) {
        throw new pathError(ERRORS.PATH_UNKNOWN_MODIFIER, keyword);
      }
      if(!allowModifiers) {
        throw new pathError(ERRORS.PATH_UNEXPECTED_MODIFIER, keyword, rule);
      }
      modifiers |= msk;
    });

    accessRules.push({
      path     : path.encode(sectionDef, name, true),
      name     : name,
      modifiers: modifiers
    });
  });

  return accessRules;
}
