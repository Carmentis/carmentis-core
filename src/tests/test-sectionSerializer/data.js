import { DATA, SECTIONS } from "../../common/constants/constants.js";

export const EXTERNAL_APP_DEF = {
  fields: [
    { name: "name",         type: DATA.STRING },
    { name: "city",         type: DATA.STRING | DATA.PRIVATE },
    { name: "address",      type: DATA.STRING | DATA.PRIVATE },
    { name: "countryCode",  type: DATA.STRING | DATA.PRIVATE, size: 2 },
    { name: "website",      type: DATA.STRING | DATA.PRIVATE },
    { name: "status",       type: DATA.ENUM | DATA.PRIVATE | 0 },
    { name: "emails",       type: DATA.STRING | DATA.ARRAY | DATA.PRIVATE },
    { name: "mainContact",  type: DATA.STRUCT | 0, structType: DATA.STRUCT_INTERNAL },
    { name: "contacts",     type: DATA.STRUCT | DATA.ARRAY | 0, structType: DATA.STRUCT_INTERNAL },
    { name: "moreContacts", type: DATA.STRUCT | DATA.ARRAY | 0, structType: DATA.STRUCT_INTERNAL }
  ],
  internalStructures: [
    {
      name: "contact",
      properties: [
        { name: "phoneNumber1", type: DATA.STRING | DATA.PRIVATE },
        { name: "phoneNumber2", type: DATA.STRING | DATA.PRIVATE }
      ]
    }
  ],
  enumerations: [
    {
      name: "status",
      values: [ "inactive", "active" ]
    }
  ],
  subsections: [
    {
      rule: "*",
      type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES,
      keyId: SECTIONS.KEY_CHANNEL | 1
    },
    {
      rule: "countryCode",
      type: DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES,
      keyId: SECTIONS.KEY_CHANNEL | 2
    },
    {
      rule: "city, address, mainContact.phoneNumber2, contacts.phoneNumber2, moreContacts.phoneNumber2",
      type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES,
      keyId: SECTIONS.KEY_CHANNEL | 2
    }
  ]
};
