import { DATA } from "../../common/constants/constants.js";

export const APP_CIRCULAR = {
  "description": {
    "name": "Dummy",
    "logoUrl": "https://dummy.testapps.carmentis.io/assets/img/logo.png",
    "homepageUrl": "https://dummy.testapps.carmentis.io?id={{ID}}&version={{VERSION}}",
    "rootDomain": "dummy.testapps.carmentis.io",
    "description": ""
  },
  "definition": {
    "fields": [
      {
        "name": "fieldStructA",
        "type": DATA.STRUCT | DATA.OPTIONAL | 0,
        "structType": DATA.STRUCT_INTERNAL
      }
    ],
    "structures": [
      {
        "name": "structA",
        "properties": [
          {
            "name": "fieldStructB",
            "type": DATA.STRUCT | DATA.OPTIONAL | 1,
            "structType": DATA.STRUCT_INTERNAL
          }
        ]
      },
      {
        "name": "structB",
        "properties": [
          {
            "name": "fieldStructA",
            "type": DATA.STRUCT | DATA.OPTIONAL | 0,
            "structType": DATA.STRUCT_INTERNAL
          }
        ]
      }
    ],
    "masks": [
    ],
    "messages": [
    ],
    "enumerations": [
    ]
  }
};
