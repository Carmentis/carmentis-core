import * as SCHEMAS from "./schemas.js";

// tokens
export const TOKEN_NAME    = "CMTS";
export const TOKEN         = 100000;
export const MILLITOKEN    = 100;
export const INITIAL_OFFER = 1000000000 * TOKEN;

// gas
export const MINIMUM_GAS_PRICE = 1;
export const MAXIMUM_GAS_PRICE = 2 ** 29 - 1;
export const FIXED_GAS_FEE     = 1000;
export const GAS_PER_BYTE      = 1;

// bookkeeping operations
export const BK_PLUS = 0x1;

export const BK_PAID_FEES     = 0x0;
export const BK_SENT_ISSUANCE = 0x2;
export const BK_SALE          = 0x4;
export const BK_SENT_PAYMENT  = 0x6;

export const BK_EARNED_FEES       = BK_PLUS | BK_PAID_FEES;
export const BK_RECEIVED_ISSUANCE = BK_PLUS | BK_SENT_ISSUANCE;
export const BK_PURCHASE          = BK_PLUS | BK_SALE;
export const BK_RECEIVED_PAYMENT  = BK_PLUS | BK_SENT_PAYMENT;

export const BK_REF_BLOCK      = 0;
export const BK_REF_MICROBLOCK = 1;
export const BK_REF_SECTION    = 2;

export const BK_REF_SCHEMAS = [
  SCHEMAS.ACCOUNT_BLOCK_REFERENCE,
  SCHEMAS.ACCOUNT_MB_REFERENCE,
  SCHEMAS.ACCOUNT_SECTION_REFERENCE
];

export const BK_REFERENCES = [
  /* BK_PAID_FEES         */ BK_REF_MICROBLOCK,
  /* BK_EARNED_FEES       */ BK_REF_BLOCK,
  /* BK_SENT_ISSUANCE     */ BK_REF_SECTION,
  /* BK_RECEIVED_ISSUANCE */ BK_REF_SECTION,
  /* BK_SALE              */ BK_REF_SECTION,
  /* BK_PURCHASE          */ BK_REF_SECTION,
  /* BK_SENT_PAYMENT      */ BK_REF_SECTION,
  /* BK_RECEIVED_PAYMENT  */ BK_REF_SECTION
];

export const BK_NAMES = [
  /* BK_PAID_FEES         */ "Paid fees",
  /* BK_EARNED_FEES       */ "Earned fees",
  /* BK_SENT_ISSUANCE     */ "Initial token issuance",
  /* BK_RECEIVED_ISSUANCE */ "Initial token issuance",
  /* BK_SALE              */ "Sale",
  /* BK_PURCHASE          */ "Purchase",
  /* BK_SENT_PAYMENT      */ "Sent payment",
  /* BK_RECEIVED_PAYMENT  */ "Received payment"
];
