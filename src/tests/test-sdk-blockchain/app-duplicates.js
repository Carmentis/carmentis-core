import { DATA } from "../../common/constants/constants.js";

export const APP_DUP_STRUCT = {
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
        "name": "fieldA",
        "type": DATA.STRUCT | DATA.OPTIONAL | 0,
        "structType": DATA.STRUCT_INTERNAL
      }
    ],
    "structures": [
      {
        "name": "structA",
        "properties": [
          {
            "name": "myProperty",
            "type": DATA.INTEGER | DATA.OPTIONAL
          }
        ]
      },
      {
        "name": "structA",
        "properties": [
          {
            "name": "myOtherProperty",
            "type": DATA.INTEGER | DATA.OPTIONAL
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

export const APP_DUP_PROP = {
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
        "name": "fieldA",
        "type": DATA.STRUCT | DATA.OPTIONAL | 0,
        "structType": DATA.STRUCT_INTERNAL
      }
    ],
    "structures": [
      {
        "name": "structA",
        "properties": [
          {
            "name": "myProperty",
            "type": DATA.INTEGER | DATA.OPTIONAL
          },
          {
            "name": "myProperty",
            "type": DATA.STRING | DATA.OPTIONAL
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

export const APP_DUP_FIELD = {
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
        "name": "fieldA",
        "type": DATA.INTEGER | DATA.OPTIONAL | 0
      },
      {
        "name": "fieldA",
        "type": DATA.STRING | DATA.OPTIONAL | 0
      }
    ],
    "structures": [
    ],
    "masks": [
    ],
    "messages": [
    ],
    "enumerations": [
    ]
  }
};
