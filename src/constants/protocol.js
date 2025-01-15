import * as ECO from "./economics.js";

// protocol version
export const VERSION = 1;

// maximum delay in the past for a microblock, in seconds
export const MAX_MICROBLOCK_PAST_DELAY = 300

// maximum delay in the future for a microblock, in seconds
export const MAX_MICROBLOCK_FUTURE_DELAY = 60

// maximum microblock size
export const MAX_MICROBLOCK_SIZE = 2 ** 24 - ECO.FIXED_GAS_FEE;
