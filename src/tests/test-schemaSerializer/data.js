import { DATA, SCHEMAS } from "../../common/constants/constants.js";

export const SCHEMA_ARRAY_INTEGERS = [
  {
    name: "array",
    type: DATA.INT | DATA.ARRAY
  }
];

export const SCHEMA_ARRAY_OBJECTS = [
  {
    name: "array",
    type: DATA.OBJECT | DATA.ARRAY,
    schema: [
      { name: "foo", type: DATA.STRING },
      { name: "bar", type: DATA.UINT16 }
    ]
  }
];

export const SCHEMA_OPTIONAL_FIELDS = [
  {
    name: "g03",
    type: DATA.OBJECT,
    schema: [
      { name: "v0", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v1", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v2", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v3", type: DATA.UINT8 | DATA.OPTIONAL }
    ]
  },
  {
    name: "g47",
    type: DATA.OBJECT,
    schema: [
      { name: "v4", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v5", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v6", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v7", type: DATA.UINT8 | DATA.OPTIONAL }
    ]
  },
  {
    name: "g89",
    type: DATA.OBJECT,
    schema: [
      { name: "v8", type: DATA.UINT8 | DATA.OPTIONAL },
      { name: "v9", type: DATA.UINT8 | DATA.OPTIONAL }
    ]
  }
];

export const MICROBLOCK_HEADER = {
  magicString    : "CMTS",
  protocolVersion: 1,
  height         : 1,
  previousHash   : "0000000000000000000000000000000000000000000000000000000000000000",
  timestamp      : 12345,
  gas            : 123,
  gasPrice       : 1000
};

export const INVALID_MICROBLOCK_HEADER = {
  magicString    : "CMTS",
  protocolVersion: 1,
  height         : 1,
  previousHash   : "0000000000000000000000000000000000000000000000000000000000000000",
  gas            : 123,
  gasPrice       : 1000
};

export const MICROBLOCK_SECTION = {
  id: 0,
  subsections: [
    {
      type: DATA.SUB_PUBLIC,
      data: new Uint8Array(0)
    },
    {
      type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES,
      keyType: 0x00,
      keyIndex: 0x00,
      accessRules: [ { path: [0] }, { path: [1, 255] } ],
      data: new Uint8Array(0)
    },
    {
      type: DATA.SUB_PRIVATE | DATA.SUB_ACCESS_RULES | DATA.SUB_PROVABLE,
      keyType: 0x00,
      keyIndex: 0x00,
      accessRules: [ { path: [0] }, { path: [1, 255] } ],
      merkleRootHash: new Uint8Array(32),
      data: new Uint8Array(0)
    }
  ]
};

export const MICROBLOCK_BODY = {
  sections: []
};

export const APPLICATION_DEFINITION = {
  fields: [
    { name: "someString", type: DATA.STRING | DATA.OPTIONAL },
    { name: "someStruct", type: DATA.STRUCT | DATA.OPTIONAL | 1 },
    { name: "someEnum", type: DATA.ENUM | DATA.OPTIONAL | 0 }
  ],
  structures: [
    {
      name: "struct0",
      properties: [
        { name: "a0", type: DATA.INT },
        { name: "b0", type: DATA.STRING | DATA.MASKABLE, maskId: 0 }
      ]
    },
    {
      name: "struct1",
      properties: [
        { name: "a1", type: DATA.INT },
        { name: "b1", type: DATA.STRING | DATA.MASKABLE, maskId: 0 }
      ]
    }
  ],
  enumerations: [
    {
      name: "enum",
      values: [ "hello", "world" ]
    }
  ],
  masks: [
    {
      name: "mask",
      regex: "/^(.)(.*?)(.@.*)$/",
      substitution: "$1***$3"
    }
  ],
  messages: [
    {
      name: "msg",
      texts: [ "Hello" ],
      fields: []
    }
  ]
};

export const APPLICATION_RECORD = {
  someString: "hello",
  someStruct: {
    a1: 123,
    b1: "info@carmentis.io"
  },
  someEnum: "world"
};

export const ORACLE_DEFINITION = {
  services: [
    {
      name: "service",
      request: [
        { name: "q1", type: DATA.STRING },
        { name: "q2", type: DATA.STRUCT | 0 }
      ],
      answer: [
        { name: "res1", type: DATA.INT },
        { name: "res2", type: DATA.STRUCT | 0 }
      ]
    }
  ],
  structures: [
    {
      name: "struct",
      properties: [
        { name: "a", type: DATA.INT },
        { name: "b", type: DATA.STRING | DATA.MASKABLE, maskId: 0 }
      ]
    }
  ],
  enumerations: [
    {
      name: "enum",
      values: [ "hello", "world" ]
    }
  ],
  masks: [
    {
      name: "mask",
      regex: "/^(.)(.*?)(.@.*)$/",
      substitution: "$1***$3"
    }
  ]
};
