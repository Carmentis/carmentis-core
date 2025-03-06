import * as ERROR_TYPES from "./error-types.js";

export const ERRORS_EN = {
  [ ERROR_TYPES.GLOBAL ]: [
    "Unknown error",
    "Internal error: %0",
    "Crypto error: %0",
    "Invalid message ID 0x%0"
  ],

  [ ERROR_TYPES.FIELD ]: [
    "%0 has type '%1' instead of expected type '%2'",
    "%0 is out of range [%1 .. %2]",
    "%0 is too large (maximum value is %1)",
    "%0 has an invalid size (expected size is %1)",
    "%0 is too large (maximum size is %1)",
    "%0 is too small (minimum size is %1)",
    "%0 is not a valid hexadecimal string (it may only contain 0..9, A..F)",
    "%0 is not an integer",
    "%0 cannot be negative",
    "%0 has an invalid decimal format",
    "%0 should have %1 decimal place(s)",
    "%0 is not a valid public key",
    "%0 is not a valid amount (expecting { currency: <string>, value: <string> })",
    "%0 has an invalid currency (expecting ISO-4217 currency code)"
  ],

  [ ERROR_TYPES.SCHEMA ]: [
    "Unable to encode: the passed argument is not an object",
    "Required field '%0' is undefined",
    "Field '%0' is an enumeration: its value must be a string",
    "Undefined enumeration %0",
    "Value '%0' of field '%1' does not belong to enumeration '%2'",
    "Invalid stream: inconsistent length (pointer = %0 / length = %1)",
    "Field '%0' is not assigned to any subsection"
  ],

  [ ERROR_TYPES.SECTION ]: [
    "Invalid object ID '%0'",
    "Invalid section ID '%0' for object '%1'",
    "External definition not provided for section with ID '%0'",
    "Public field '%0' cannot be assigned to a private subsection",
    "Inconsistent Merkle root hash in subsection with ID 0x%0 (expected: %1 / computed: %2)",
    "Key not found: ID=0x%0"
  ],

  [ ERROR_TYPES.PATH ]: [
    "Invalid syntax for access rule '%0'",
    "Unknown modifier '%0'",
    "Modifier '%0' not allowed in access rule '%1'",
    "Unknown field '%0'",
    "'%0' is a structure and must be followed by a property",
    "'%0' is a primitive type and cannot be followed by other fields",
    "Invalid path encoding",
    "Unexpected wildcard"
  ],

  [ ERROR_TYPES.BLOCKCHAIN ]: [
    "No root key provided",
    "Database interface is not set up",
    "Blockchain interface is not set up",
    "Unable to load virtual blockchain '%0'",
    "Unable to load microblock '%0'",
    "Invalid virtual blockchain ID '%0'",
    "Invalid virtual blockchain type '%0'",
    "Invalid virtual blockchain type: expecting '%0', got '%1'",
    "Invalid microblock structure",
    "Invalid signature",
    "Inconsistent gas amount",
    "Invalid gas price",
    "Maximum microblock size exceeded",
    "Microblock timestamp too far in the past",
    "Microblock timestamp too far in the future",
    "Invalid protocol version: expecting '%0', got '%1'",
    "Unable to retrieve microblock at height %0"
  ],

  [ ERROR_TYPES.ACCOUNT ]: [
    "Invalid amount for token issuance",
    "Invalid public key for token issuance",
    "Unknown account %0",
    "A public key is already attached to this account",
    "No public key is attached to this account",
    "The public key %0 is already attached to another account",
    "The public key %0 is not attached to any account",
    "Insufficient funds on account %0",
    "Invalid payee account %0",
    "Buyer account %0 already exists"
  ],

  [ ERROR_TYPES.APPLICATION ]: [
    "Organization is not declared",
    "Inconsistent version number: expecting %0, got %1",
    "Circular reference on structure '%0'",
    "Duplicate field name '%0'",
    "Duplicate structure name '%0'",
    "Duplicate property name '%0'"
  ],

  [ ERROR_TYPES.APP_LEDGER ]: [
    "Invalid actor id %0",
    "Invalid actor type '%0' (should be one of 'applicationOwner', 'organization' or 'endUser')",
    "Invalid channel id %0",
    "Duplicate actor '%0'",
    "Duplicate channel '%0'",
    "Unknown actor '%0'",
    "Unknown channel '%0'",
    "Unknown message '%0'",
    "Actor '%0' is already subscribed to this application ledger",
    "Actor '%0' cannot be invited (this actor is not yet subscribed to this application ledger)"
  ],

  [ ERROR_TYPES.ORACLE ]: [
    "Organization is not declared",
    "Unable to load service '%0'",
    "Invalid request signature"
  ],

  [ ERROR_TYPES.WI ]: [
    "Invalid signature"
  ]
};
