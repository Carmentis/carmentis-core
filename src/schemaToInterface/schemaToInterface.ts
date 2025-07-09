import {DATA, SCHEMAS} from "../common/constants/constants";

const schemaTypeToJsType = {
  [ DATA.TYPE_STRING   ]: "string",
  [ DATA.TYPE_NUMBER   ]: "number",
  [ DATA.TYPE_BOOLEAN  ]: "boolean",
  [ DATA.TYPE_NULL     ]: "null",
  [ DATA.TYPE_UINT8    ]: "number",
  [ DATA.TYPE_UINT16   ]: "number",
  [ DATA.TYPE_UINT24   ]: "number",
  [ DATA.TYPE_UINT32   ]: "number",
  [ DATA.TYPE_UINT48   ]: "number",
  [ DATA.TYPE_BINARY   ]: "Uint8Array",
  [ DATA.TYPE_BIN256   ]: "Uint8Array",
  [ DATA.TYPE_HASH_STR ]: "string"
};

const BLOCK_INDENT = "  ";

function translateSchema(schema: SCHEMAS.SchemaItem[], name: string) {
  const code = walk(schema);

  return `export interface ${name} {\n${code.join("\n")}\n}\n`;

  function walk(list: SCHEMAS.SchemaItem[], indent = BLOCK_INDENT) {
    const code = [];

    for(const item: SCHEMAS.SchemaItem of list) {
      const mainType = item.type & DATA.TYPE_MAIN;
      const arraySuffix = item.type & DATA.TYPE_ARRAY_OF ? "[]" : "";
      const name = item.optional ? item.name + "?" : item.name;

      if(mainType == DATA.TYPE_OBJECT) {
        if(item.unspecifiedSchema) {
          code.push(indent + `${name}: object${arraySuffix};`);
        }
        else {
          code.push(indent + `${name}: {`);
          code.push(...walk(item.schema, indent + BLOCK_INDENT));
          code.push(indent + `}${arraySuffix};`);
        }
      }
      else {
        code.push(indent + `${name}: ${schemaTypeToJsType[mainType]}${arraySuffix};`);
      }
    }
    return code;
  }
}

console.log(translateSchema(SCHEMAS.VB_STATES[0], "AccountVbState"));
console.log(translateSchema(SCHEMAS.VB_STATES[1], "ValidatorNodeVbState"));
console.log(translateSchema(SCHEMAS.VB_STATES[2], "OrganizationVbState"));
console.log(translateSchema(SCHEMAS.VB_STATES[3], "ApplicationVbState"));
console.log(translateSchema(SCHEMAS.VB_STATES[4], "AppLedgerVbState"));

console.log(translateSchema(SCHEMAS.RECORD_DESCRIPTION, "RecordDescription"));
