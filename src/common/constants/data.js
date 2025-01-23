// primitive types
export const OBJECT    = 0x00; // -> SCHEMA?
export const INT       = 0x01;
export const UINT      = 0x02;
export const UINT8     = 0x03;
export const UINT16    = 0x04;
export const UINT24    = 0x05;
export const UINT32    = 0x06;
export const UINT48    = 0x07;
export const STRING    = 0x08;
export const DECIMAL   = 0x09;
export const AMOUNT    = 0x0A;
export const TIMESTAMP = 0x0B;
export const DATE      = 0x0C;
export const HASH      = 0x0D;
export const FILE      = 0x0E;
export const BINARY    = 0x0F;
export const BIN128    = 0x10;
export const BIN256    = 0x11;
export const BIN264    = 0x12;
export const BIN512    = 0x13;
export const PUB_KEY   = 0x14;
export const PRIV_KEY  = 0x15;
export const AES_KEY   = 0x16;
export const SIGNATURE = 0x17;

export const PrimitiveTypes = {
  INT: 0x01,
  UINT: 0x02,
  UINT8: 0x03,
  UINT16: 0x04,
  UINT24: 0x05,
  UINT32: 0x06,
  UINT48: 0x07,
  STRING: 0x08,
  DECIMAL: 0x09,
  AMOUNT: 0x0A,
  TIMESTAMP: 0x0B,
  DATE: 0x0C,
  HASH: 0x0D,
  FILE: 0x0E,
  BINARY: 0x0F,
  BIN128: 0x10,
  BIN256: 0x11,
  BIN264: 0x12,
  BIN512: 0x13,
};

export const NAME = [
  "OBJECT",
  "INT",
  "UINT",
  "UINT8",
  "UINT16",
  "UINT24",
  "UINT32",
  "UINT48",
  "STRING",
  "DECIMAL",
  "AMOUNT",
  "TIMESTAMP",
  "DATE",
  "HASH",
  "FILE",
  "BINARY",
  "BIN128",
  "BIN256",
  "BIN264",
  "BIN512",
  "PUB_KEY",
  "PRIV_KEY",
  "AES_KEY",
  "SIGNATURE"
];

// common flags
export const STRUCT   = 0x8000;
export const ARRAY    = 0x4000; // -> multi-dimensional?
export const ENUM     = 0x2000;
export const OPTIONAL = 0x1000;

// flags for primitive types
export const PRIVATE  = 0x0800;
export const MASKABLE = 0x0200; // \__ anonymization
export const HASHABLE = 0x0400; // /

// bitmasks
export const MSK_OBJECT_INDEX   = 0x03FF;
export const MSK_PRIMITIVE_TYPE = 0x001F;

// access rules flags
export const PLAIN    = 0x0;
export const MASKED   = 0x1;
export const HASHED   = 0x2;
export const REDACTED = 0x4;

// wildcard
export const WILDCARD = 0xFF;

// field references
export const REF_THIS     = 0x0;
export const REF_LAST     = 0x1;
export const REF_PREVIOUS = 0x2;

export const REF_NAME = [
  "this",
  "last",
  "previous"
];

// section
export const EXTERNAL_SCHEMA = 0x80;

export const SUB_PUBLIC       = 0x00;
export const SUB_PRIVATE      = 0x01;
export const SUB_PROVABLE     = 0x02;
export const SUB_ACCESS_RULES = 0x04;

// Merkle
export const MERKLE_PEPPER_SIZE = 16;
export const MERKLE_SALT_SIZE   = 16;

// Actor types
export const ACTOR_APP_OWNER    = 0;
export const ACTOR_ORGANIZATION = 1;
export const ACTOR_END_USER     = 2;

export const ACTOR_NAME = [
  "applicationOwner",
  "organization",
  "endUser"
];

// null hash
export const NULL_HASH = "0".repeat(64);
