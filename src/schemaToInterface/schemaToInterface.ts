import {CHAIN, DATA, SCHEMAS, SECTIONS} from "../common/constants/constants";
import {Utils} from "../common/utils/utils";

const schemaTypeToJsType = new Map([
  [ DATA.TYPE_STRING,   "string"     ],
  [ DATA.TYPE_NUMBER,   "number"     ],
  [ DATA.TYPE_BOOLEAN,  "boolean"    ],
  [ DATA.TYPE_NULL,     "null"       ],
  [ DATA.TYPE_UINT8,    "number"     ],
  [ DATA.TYPE_UINT16,   "number"     ],
  [ DATA.TYPE_UINT24,   "number"     ],
  [ DATA.TYPE_UINT32,   "number"     ],
  [ DATA.TYPE_UINT48,   "number"     ],
  [ DATA.TYPE_BINARY,   "Uint8Array" ],
  [ DATA.TYPE_BIN256,   "Uint8Array" ],
  [ DATA.TYPE_HASH_STR, "string"     ]
]);

const BLOCK_INDENT = "  ";

generateInterfaces();

function generateInterfaces() {
  let output = [];

  output.push(`/**\n  GENERATED CODE - DO NOT EDIT\n*/`);

  // single schemas
  for(const schema of SCHEMAS.ALL_SCHEMAS.singles) {
    output.push(translateSchema(schema));
  }

  // schema collections
  for(const collection of SCHEMAS.ALL_SCHEMAS.collections) {
    output.push(generateCollection(collection.label, collection.list));
  }

  // sections
  output.push(...generateSections());

  console.log(output.join("\n"));
}

function generateSections() {
  let output = [];

  output.push(`export enum SectionType {`);

  [ CHAIN.VB_ACCOUNT, CHAIN.VB_VALIDATOR_NODE, CHAIN.VB_ORGANIZATION, CHAIN.VB_APPLICATION, CHAIN.VB_APP_LEDGER ]
  .forEach((vbId) => {
    if(vbId) {
      output.push("");
    }
    output.push(BLOCK_INDENT + "// " + CHAIN.VB_NAME[vbId]);

    SECTIONS.DEF[vbId].forEach((section, sectionId) => {
      output.push(BLOCK_INDENT + section.label + " = 0x" + Utils.numberToHexa(vbId << 8 | sectionId, 3) + ";");
    });
  });
  output.push(`}`);

  return output;
}

function generateCollection(label: string, list: SCHEMAS.Schema[]) {
  let output = [];

  output.push(`/**\n  Schema collection: ${label}\n*/`);

  for(const schema of list) {
    output.push(translateSchema(schema));
  }

  output.push(`type ${label} =`);
  output.push(list.map((o) => BLOCK_INDENT + o.label).join(" |\n") + ";\n");

  return output.join("\n");
}

function translateSchema(schema: SCHEMAS.Schema): string {
  const code = traverse(schema.definition);

  return `export interface ${schema.label} {\n${code.join("\n")}\n}\n`;

  function traverse(list: SCHEMAS.SchemaItem[], indent = BLOCK_INDENT): string[] {
    const code = [];

    for(const item of list) {
      const mainType = item.type & DATA.TYPE_MAIN;
      const arraySuffix = item.type & DATA.TYPE_ARRAY_OF ? "[]" : "";
      const name = item.optional ? item.name + "?" : item.name;

      if(mainType == DATA.TYPE_OBJECT) {
        if(item.unspecifiedSchema) {
          code.push(indent + `${name}: object${arraySuffix};`);
        }
        else {
          if(item.schema) {
            code.push(indent + `${name}: ${item.schema.label}${arraySuffix};`);
          }
          else {
            if(!item.definition) {
              throw `missing definition in schema`;
            }
            code.push(indent + `${name}: {`);
            code.push(...traverse(item.definition, indent + BLOCK_INDENT));
            code.push(indent + `}${arraySuffix};`);
          }
        }
      }
      else {
        code.push(indent + `${name}: ${schemaTypeToJsType.get(mainType)}${arraySuffix};`);
      }
    }
    return code;
  }
}
