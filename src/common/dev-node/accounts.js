import { DATA, ECO, SCHEMAS, ERRORS } from "../constants/constants.js";
import { schemaSerializer } from "../serializers/serializers.js";
import * as crypto from "../crypto/crypto.js";
import * as uint8 from "../util/uint8.js";
import { accountError } from "../errors/error.js";

export const FEES_ACCOUNT = "0".repeat(31) + "1";

let dbInterface;

// ============================================================================================================================ //
//  setDbInterface()                                                                                                            //
// ============================================================================================================================ //
export function setDbInterface(intf) {
  dbInterface = intf;
}

// ============================================================================================================================ //
//  tokenTransfer()                                                                                                             //
// ============================================================================================================================ //
export async function tokenTransfer(transfer, chainReference, timestamp, apply) {
  let accountCreation = transfer.type == ECO.BK_SENT_ISSUANCE || transfer.type == ECO.BK_SALE,
      payeeBalance,
      payerBalance,
      obj;

  if(transfer.payerAccount === null) {
    payerBalance = null;
  }
  else {
    let payerState = await loadState(transfer.payerAccount);

    payerBalance = payerState.balance;

    if(payerBalance < transfer.amount) {
      throw new accountError(ERRORS.ACCOUNT_INSUFFICIENT_FUNDS, transfer.payerAccount);
    }
  }

  if(transfer.payeeAccount === null) {
    payeeBalance = null;
  }
  else {
    let payeeState = await loadState(transfer.payeeAccount);

    if(accountCreation){
      if(payeeState.height != 0) {
        throw new accountError(ERRORS.ACCOUNT_ALREADY_EXISTS, transfer.payeeAccount);
      }
    }
    else {
      if(payeeState.height == 0) {
        throw new accountError(ERRORS.ACCOUNT_INVALID_PAYEE, transfer.payeeAccount);
      }
    }

    payeeBalance = payeeState.balance;
  }

  if(apply) {
    if(payerBalance !== null) {
      await update(transfer.type, transfer.payerAccount, transfer.payeeAccount, transfer.amount, chainReference, timestamp);
    }

    if(payeeBalance !== null) {
      await update(transfer.type ^ 1, transfer.payeeAccount, transfer.payerAccount, transfer.amount, chainReference, timestamp);
    }
  }
}

// ============================================================================================================================ //
//  loadState()                                                                                                                 //
// ============================================================================================================================ //
export async function loadState(accountHash) {
  let record = await dbInterface.get(SCHEMAS.DB_ACCOUNT_STATE, accountHash),
      state;

  if(record) {
    state = schemaSerializer.decode(SCHEMAS.DB[SCHEMAS.DB_ACCOUNT_STATE], record);
  }
  else {
    state = {
      height: 0,
      balance: 0,
      lastHistoryHash: DATA.NULL_HASH
    };
  }

  return state;
}

// ============================================================================================================================ //
//  update()                                                                                                                    //
// ============================================================================================================================ //
async function update(type, accountHash, linkedAccountHash, amount, chainReference, timestamp) {
  let state = await loadState(accountHash);

  state.height++;
  state.balance += type & ECO.BK_PLUS ? amount : -amount;
  state.lastHistoryHash = await addHistoryEntry(state, type, accountHash, linkedAccountHash, amount, chainReference, timestamp);

  await dbInterface.put(
    SCHEMAS.DB_ACCOUNT_STATE,
    accountHash,
    schemaSerializer.encode(
      SCHEMAS.DB[SCHEMAS.DB_ACCOUNT_STATE],
      state
    )
  );
}

// ============================================================================================================================ //
//  loadHistory()                                                                                                               //
// ============================================================================================================================ //
export async function loadHistory(accountHash, lastHistoryHash, maxRecords) {
  let historyHash = lastHistoryHash,
      list = [];

  while(maxRecords-- && historyHash != DATA.NULL_HASH) {
    let entry = await loadHistoryEntry(accountHash, historyHash);

    list.push(entry)
    historyHash = entry.previousHistoryHash;
  }

  return { list: list };
}

// ============================================================================================================================ //
//  loadHistoryEntry()                                                                                                          //
// ============================================================================================================================ //
async function loadHistoryEntry(accountHash, historyHash) {
  let record = await dbInterface.get(SCHEMAS.DB_ACCOUNT_HISTORY, historyHash),
      entry;

  if(!record) {
    throw "Internal error: account history entry not found";
  }

  entry = schemaSerializer.decode(SCHEMAS.DB[SCHEMAS.DB_ACCOUNT_HISTORY], record);

  return entry
}

// ============================================================================================================================ //
//  addHistoryEntry()                                                                                                           //
// ============================================================================================================================ //
async function addHistoryEntry(state, type, accountHash, linkedAccountHash, amount, chainReference, timestamp) {
  let chainReferenceBinary = schemaSerializer.encode(
    ECO.BK_REF_SCHEMAS[ECO.BK_REFERENCES[type]],
    chainReference
  );

  let entry = {
    height             : state.height,
    previousHistoryHash: state.lastHistoryHash,
    type               : type,
    timestamp          : timestamp,
    linkedAccount      : linkedAccountHash || DATA.NULL_HASH,
    amount             : amount,
    chainReference     : chainReferenceBinary
  };

  let record = schemaSerializer.encode(SCHEMAS.DB[SCHEMAS.DB_ACCOUNT_HISTORY], entry),
      hash = getHistoryEntryHash(uint8.fromHexa(accountHash), crypto.sha256AsBinary(record));

  await dbInterface.put(
    SCHEMAS.DB_ACCOUNT_HISTORY,
    hash,
    record
  );

  return hash;
}

// ============================================================================================================================ //
//  getHistoryEntryHash()                                                                                                       //
// ============================================================================================================================ //
function getHistoryEntryHash(accountHash, recordHash) {
  return crypto.sha256(uint8.from(accountHash, recordHash));
}

// ============================================================================================================================ //
//  testPublicKeyAvailability()                                                                                                 //
// ============================================================================================================================ //
export async function testPublicKeyAvailability(publicKey) {
  let keyHash = crypto.sha256(uint8.fromHexa(publicKey));

  let accountHash = await dbInterface.get(
    SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
    keyHash
  );

  if(accountHash) {
    throw new accountError(ERRORS.ACCOUNT_KEY_ALREADY_IN_USE, publicKey);
  }
}

// ============================================================================================================================ //
//  saveAccountByPublicKey()                                                                                                    //
// ============================================================================================================================ //
export async function saveAccountByPublicKey(accountHash, publicKey) {
  let keyHash = crypto.sha256(uint8.fromHexa(publicKey));

  await dbInterface.put(
    SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
    keyHash,
    accountHash
  );
}

// ============================================================================================================================ //
//  loadAccountByPublicKey()                                                                                                    //
// ============================================================================================================================ //
export async function loadAccountByPublicKey(publicKey) {
  let keyHash = crypto.sha256(uint8.fromHexa(publicKey));

  let accountHash = await dbInterface.get(
    SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
    keyHash
  );

  if(!accountHash) {
    throw new accountError(ERRORS.ACCOUNT_KEY_UNKNOWN, publicKey);
  }

  return accountHash;
}
