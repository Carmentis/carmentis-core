import { DATA, SECTIONS } from "../../common/constants/constants.js";

export const EXTERNAL_APP_DEF = {
  fields: [
    { name: "name",           type: DATA.STRING },
    { name: "city",           type: DATA.STRING | DATA.PRIVATE },
    { name: "address",        type: DATA.STRUCT | 0, structType: DATA.STRUCT_INTERNAL },
    { name: "countryCode",    type: DATA.STRING | DATA.PRIVATE, size: 2 },
    { name: "website",        type: DATA.STRING | DATA.PRIVATE },
    { name: "array",          type: DATA.STRING | DATA.ARRAY | DATA.PRIVATE },
    { name: "optionalField",  type: DATA.STRING | DATA.OPTIONAL | DATA.PRIVATE },
    { name: "optionalStruct", type: DATA.STRUCT | DATA.OPTIONAL | 1, structType: DATA.STRUCT_INTERNAL }
  ],
  internalStructures: [
    {
      name: "address",
      properties: [
        { name: "line1", type: DATA.STRING | DATA.PRIVATE },
        { name: "line2", type: DATA.STRING | DATA.PRIVATE }
      ]
    },
    {
      name: "dummy",
      properties: [
        { name: "someField", type: DATA.STRING | DATA.PRIVATE }
      ]
    }
  ],
  subsections: [
    { rule: "*",               type: DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES, keyId: SECTIONS.KEY_CHANNEL | 1 },
    { rule: "countryCode",     type: DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES, keyId: SECTIONS.KEY_CHANNEL | 2 },
    { rule: "city, address.*", type: DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES, keyId: SECTIONS.KEY_CHANNEL | 3 }
  ]
};
