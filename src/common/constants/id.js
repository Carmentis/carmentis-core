// object types
export const OBJ_ACCOUNT        = 0;
export const OBJ_VALIDATOR_NODE = 1;
export const OBJ_ORGANIZATION   = 2;
export const OBJ_APP_USER       = 3;
export const OBJ_APPLICATION    = 4;
export const OBJ_APP_LEDGER     = 5;
export const OBJ_ORACLE         = 6;

export const N_OBJECTS = 7;

export const OBJECT_NAME = [
  "account",
  "validator node",
  "organization",
  "application user",
  "application",
  "application ledger",
  "oracle"
];

// block states
export const BLOCK_PENDING  = 0;
export const BLOCK_CLOSED   = 1;
export const BLOCK_ANCHORED = 2;
