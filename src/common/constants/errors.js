import { ERRORS_EN } from "./errors-en.js";
import { ERRORS_FR } from "./errors-fr.js";

export const MSG = {
  "EN": ERRORS_EN,
  "FR": ERRORS_FR
};

// GLOBAL
export const GLOBAL_UNKNOWN_ERROR  = 0x00;
export const GLOBAL_INTERNAL_ERROR = 0x01;
export const GLOBAL_CRYPTO_ERROR   = 0x02;

// FIELD
export const FIELD_BAD_TYPE           = 0x00;
export const FIELD_OUT_OF_RANGE       = 0x01;
export const FIELD_UINT_TOO_LARGE     = 0x02;
export const FIELD_INVALID_SIZE       = 0x03;
export const FIELD_SIZE_TOO_LARGE     = 0x04;
export const FIELD_SIZE_TOO_SMALL     = 0x05;
export const FIELD_NOT_HEXA           = 0x06;
export const FIELD_NOT_INTEGER        = 0x07;
export const FIELD_NOT_UNSIGNED       = 0x08;
export const FIELD_NOT_DECIMAL        = 0x09;
export const FIELD_BAD_DECIMAL_PLACES = 0x0A;
export const FIELD_NOT_PUBLIC_KEY     = 0x0B;
export const FIELD_INVALID_AMOUNT     = 0x0C;
export const FIELD_INVALID_CURRENCY   = 0x0D;

// SCHEMA
export const SCHEMA_CANNOT_ENCODE   = 0x00;
export const SCHEMA_UNDEFINED_FIELD = 0x01;
export const SCHEMA_INVALID_ENUM    = 0x02;
export const SCHEMA_UNDEFINED_ENUM  = 0x03;
export const SCHEMA_NOT_IN_ENUM     = 0x04;
export const SCHEMA_INVALID_STREAM  = 0x05;
export const SCHEMA_NO_SUBSECTION   = 0x06;

// SECTION
export const SECTION_INVALID_OBJECT_ID = 0x00;
export const SECTION_INVALID_ID        = 0x01;
export const SECTION_NO_EXTERNAL_DEF   = 0x02;
export const SECTION_PUBLIC_TO_PRIVATE = 0x03;
export const SECTION_BAD_MERKLE_HASH   = 0x04;
export const SECTION_KEY_NOT_FOUND     = 0x05;

// PATH
export const PATH_INVALID_RULE        = 0x00;
export const PATH_UNKNOWN_MODIFIER    = 0x01;
export const PATH_UNEXPECTED_MODIFIER = 0x02;
export const PATH_UNKNOWN_FIELD       = 0x03;
export const PATH_INCOMPLETE_STRUCT   = 0x04;
export const PATH_NOT_A_STRUCT        = 0x05;
export const PATH_INVALID_ENCODING    = 0x06;
export const PATH_UNEXPECTED_WILDCARD = 0x07;

// BLOCKCHAIN
export const BLOCKCHAIN_NO_ROOT_KEY          = 0x00;
export const BLOCKCHAIN_NO_DB_INTERFACE      = 0x01;
export const BLOCKCHAIN_NO_CHAIN_INTERFACE   = 0x02;
export const BLOCKCHAIN_CANNOT_LOAD_VB       = 0x03;
export const BLOCKCHAIN_CANNOT_LOAD_MB       = 0x04;
export const BLOCKCHAIN_INVALID_VB_ID        = 0x05;
export const BLOCKCHAIN_INVALID_VB_TYPE      = 0x06;
export const BLOCKCHAIN_VB_TYPE_MISMATCH     = 0x07;
export const BLOCKCHAIN_BAD_MB_STRUCTURE     = 0x08;
export const BLOCKCHAIN_BAD_SIGNATURE        = 0x09;
export const BLOCKCHAIN_MB_INVALID_GAS       = 0x0A;
export const BLOCKCHAIN_MB_INVALID_GAS_PRICE = 0x0B;
export const BLOCKCHAIN_MB_TOO_LARGE         = 0x0C;
export const BLOCKCHAIN_MB_TOO_FAR_PAST      = 0x0D;
export const BLOCKCHAIN_MB_TOO_FAR_FUTURE    = 0x0E;
export const BLOCKCHAIN_BAD_PROTOCOL_VERSION = 0x0F;
export const BLOCKCHAIN_MB_NOT_FOUND         = 0x10;

// ACCOUNT
export const ACCOUNT_BAD_ISSUANCE_AMOUNT = 0x00;
export const ACCOUNT_BAD_ISSUANCE_KEY    = 0x01;
export const ACCOUNT_UNKNOWN             = 0x02;
export const ACCOUNT_KEY_DUPLICATE       = 0x03;
export const ACCOUNT_KEY_UNDEFINED       = 0x04;
export const ACCOUNT_KEY_ALREADY_IN_USE  = 0x05;
export const ACCOUNT_KEY_UNKNOWN         = 0x06;
export const ACCOUNT_INSUFFICIENT_FUNDS  = 0x07;
export const ACCOUNT_INVALID_PAYEE       = 0x08;
export const ACCOUNT_ALREADY_EXISTS      = 0x09;

// APPLICATION
export const APPLICATION_MISSING_ORG = 0x00;

// APP LEDGER
export const APP_LEDGER_BAD_ACTOR_ID       = 0x00;
export const APP_LEDGER_BAD_ACTOR_TYPE     = 0x01;
export const APP_LEDGER_BAD_CHANNEL_ID     = 0x02;
export const APP_LEDGER_DUPLICATE_ACTOR    = 0x03;
export const APP_LEDGER_DUPLICATE_CHANNEL  = 0x04;
export const APP_LEDGER_UNKNOWN_ACTOR      = 0x05;
export const APP_LEDGER_UNKNOWN_CHANNEL    = 0x06;
export const APP_LEDGER_UNKNOWN_MESSAGE    = 0x07;
export const APP_LEDGER_ALREADY_SUBSCRIBED = 0x08;
export const APP_LEDGER_CANNOT_INVITE      = 0x09;

// ORACLE
export const ORACLE_MISSING_ORG           = 0x00;
export const ORACLE_UNKNOWN_SERVICE       = 0x01;
export const ORACLE_BAD_REQUEST_SIGNATURE = 0x02;

// WALLET INTERFACE
export const WI_INVALID_SIGNATURE = 0x00;
