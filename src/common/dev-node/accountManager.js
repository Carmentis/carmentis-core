import { DATA, ECO, SCHEMAS, ERRORS } from "../constants/constants.js";
import { schemaSerializer } from "../serializers/serializers.js";
import { Crypto } from "../crypto/crypto.js";
import { Utils } from "../utils/utils.js";
//import { accountError } from "../errors/error.js";

export const FEES_ACCOUNT = "0".repeat(31) + "1";

export class AccountManager {
  constructor(dbInterface) {
    this.dbInterface = dbInterface;
  }

  async tokenTransfer(transfer, chainReference, timestamp, apply) {
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
//      throw new accountError(ERRORS.ACCOUNT_INSUFFICIENT_FUNDS, transfer.payerAccount);
        throw `insufficient funds`;
      }
    }

    if(transfer.payeeAccount === null) {
      payeeBalance = null;
    }
    else {
      let payeeState = await loadState(transfer.payeeAccount);

      if(accountCreation){
        if(payeeState.height != 0) {
//        throw new accountError(ERRORS.ACCOUNT_ALREADY_EXISTS, transfer.payeeAccount);
          throw `account already exists`;
        }
      }
      else {
        if(payeeState.height == 0) {
//        throw new accountError(ERRORS.ACCOUNT_INVALID_PAYEE, transfer.payeeAccount);
          throw `invalid payee`;
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

  async loadState(accountHash) {
    const state = await this.dbInterface.getObject(SCHEMAS.DB_ACCOUNT_STATE, accountHash);

    if(state) {
      return state;
    }

    return {
      height: 0,
      balance: 0,
      lastHistoryHash: DATA.NULL_HASH
    };
  }

  async update(type, accountHash, linkedAccountHash, amount, chainReference, timestamp) {
    let state = await loadState(accountHash);

    state.height++;
    state.balance += type & ECO.BK_PLUS ? amount : -amount;
    state.lastHistoryHash = await addHistoryEntry(state, type, accountHash, linkedAccountHash, amount, chainReference, timestamp);

    await dbInterface.putObject(
      SCHEMAS.DB_ACCOUNT_STATE,
      accountHash,
      state
    );
  }

  async loadHistory(accountHash, lastHistoryHash, maxRecords) {
    const historyHash = lastHistoryHash;
    const list = [];

    while(maxRecords-- && historyHash != DATA.NULL_HASH) {
      const entry = await loadHistoryEntry(accountHash, historyHash);

      list.push(entry)
      historyHash = entry.previousHistoryHash;
    }

    return { list };
  }

  async loadHistoryEntry(accountHash, historyHash) {
    const entry = await this.dbInterface.getObject(SCHEMAS.DB_ACCOUNT_HISTORY, historyHash);

    if(!entry) {
      throw `Internal error: account history entry not found`;
    }

    return entry
  }

  async addHistoryEntry(state, type, accountHash, linkedAccountHash, amount, chainReference, timestamp) {
    const chainReferenceBinary = schemaSerializer.encode(
      ECO.BK_REF_SCHEMAS[ECO.BK_REFERENCES[type]],
      chainReference
    );

    const entry = {
      height             : state.height,
      previousHistoryHash: state.lastHistoryHash,
      type               : type,
      timestamp          : timestamp,
      linkedAccount      : linkedAccountHash || DATA.NULL_HASH,
      amount             : amount,
      chainReference     : chainReferenceBinary
    };

    const record = schemaSerializer.encode(SCHEMAS.DB[SCHEMAS.DB_ACCOUNT_HISTORY], entry);
    const hash = getHistoryEntryHash(uint8.fromHexa(accountHash), Crypto.Hashes.sha256AsBinary(record));

    await this.dbInterface.put(
      SCHEMAS.DB_ACCOUNT_HISTORY,
      hash,
      record
    );

    return hash;
  }

  getHistoryEntryHash(accountHash, recordHash) {
    return Crypto.Hashes.sha256(uint8.from(accountHash, recordHash));
  }

  async testPublicKeyAvailability(publicKey) {
    let keyHash = Crypto.Hashes.sha256(uint8.fromHexa(publicKey));

    let accountHash = await this.dbInterface.get(
      SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
      keyHash
    );

    if(accountHash) {
//    throw new accountError(ERRORS.ACCOUNT_KEY_ALREADY_IN_USE, publicKey);
      throw `key already in use`;
    }
  }

  async saveAccountByPublicKey(accountHash, publicKey) {
    let keyHash = Crypto.Hashes.sha256(uint8.fromHexa(publicKey));

    await this.dbInterface.put(
      SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
      keyHash,
      accountHash
    );
  }

  async loadAccountByPublicKey(publicKey) {
    let keyHash = Crypto.Hashes.sha256(uint8.fromHexa(publicKey));

    let accountHash = await this.dbInterface.get(
      SCHEMAS.DB_ACCOUNT_BY_PUBLIC_KEY,
      keyHash
    );

    if(!accountHash) {
      throw new accountError(ERRORS.ACCOUNT_KEY_UNKNOWN, publicKey);
    }

    return accountHash;
  }
}
