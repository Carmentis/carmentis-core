import { DATA } from "../../common/constants/constants.js";

export const KEY_ID0 = 100;
export const KEY_ID1 = 101;

export const EXTERNAL_APP_DEF = {
  fields: [
    { name: "name",        type: DATA.STRING },
    { name: "city",        type: DATA.STRING | DATA.PRIVATE },
    { name: "address",     type: DATA.STRING | DATA.PRIVATE },
    { name: "countryCode", type: DATA.STRING | DATA.PRIVATE, size: 2 },
    { name: "website",     type: DATA.STRING | DATA.PRIVATE }
  ],
  subsections: [
    {
      rule: "*",             type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES, keyId: KEY_ID0, keyIndex0: 0, keyIndex1: 0 },
    { rule: "countryCode",   type: DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES, keyId: KEY_ID1, keyIndex0: 0, keyIndex1: 0 },
    { rule: "city, address", type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES, keyId: KEY_ID1, keyIndex0: 0, keyIndex1: 0 }
  ]
};
