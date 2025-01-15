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

export const BK_SENT_ISSUANCE     = 0x0;
export const BK_PAID_FEES         = 0x2;
export const BK_SALE              = 0x4;
export const BK_SENT_PAYMENT      = 0x6;

export const BK_RECEIVED_ISSUANCE = BK_SENT_ISSUANCE | BK_PLUS;
export const BK_EARNED_FEES       = BK_PAID_FEES | BK_PLUS;
export const BK_PURCHASE          = BK_SALE | BK_PLUS;
export const BK_RECEIVED_PAYMENT  = BK_SENT_PAYMENT | BK_PLUS;

export const BK_NAMES = [
  /* BK_SENT_ISSUANCE     */ "Initial token issuance",
  /* BK_RECEIVED_ISSUANCE */ "Initial token issuance",
  /* BK_PAID_FEES         */ "Paid fees",
  /* BK_EARNED_FEES       */ "Earned fees",
  /* BK_SALE              */ "Sale",
  /* BK_PURCHASE          */ "Purchase",
  /* BK_OUTGOING_TRANSFER */ "Sent payment",
  /* BK_INCOMING_TRANSFER */ "Received payment"
];
