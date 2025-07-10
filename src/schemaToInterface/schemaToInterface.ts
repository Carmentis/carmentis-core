import {DATA, SCHEMAS} from "../common/constants/constants";

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

  for(const schema of SCHEMAS.ALL_SCHEMAS.singles) {
    output.push(translateSchema(schema));
  }
  for(const collection of SCHEMAS.ALL_SCHEMAS.collections) {
    output.push(`/**\n  Schema collection: ${collection.label}\n*/`);

    for(const schema of collection.list) {
      output.push(translateSchema(schema));
    }

    output.push(`type ${collection.label} =`);
    output.push(collection.list.map((o) => BLOCK_INDENT + o.label).join(" |\n") + ";\n");
  }
  console.log(output.join("\n"));
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
