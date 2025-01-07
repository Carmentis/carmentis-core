import { DATA } from "../../constants/constants.js";

export const KEY_INDEX = 101;

export const EXTERNAL_APP_DEF = {
  fields: [
    { name: "name",        type: DATA.STRING },
    { name: "city",        type: DATA.STRING | DATA.PRIVATE },
    { name: "address",     type: DATA.STRING | DATA.PRIVATE },
    { name: "countryCode", type: DATA.STRING | DATA.PRIVATE, size: 2 },
    { name: "website",     type: DATA.STRING | DATA.PRIVATE }
  ],
  subsections: [
    [ "*",             DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES, KEY_INDEX, 0 ],
    [ "countryCode",   DATA.SUB_PRIVATE | DATA.SUB_PROVABLE | DATA.SUB_ACCESS_RULES, KEY_INDEX, 1 ],
    [ "city, address", DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES, KEY_INDEX, 1 ]
  ]
};
