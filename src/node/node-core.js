import * as sdk from "../sdk.js";

const { ECO, ID, DATA, SCHEMAS, SECTIONS, ERRORS } = sdk.constants;
const { schemaSerializer } = sdk.serializers;
const { blockchainCore, ROLES, blockchainManager, accountVb } = sdk.blockchain;
const { CarmentisError, globalError, blockchainError, accountError } = sdk.errors;

const accounts = new Map();

let dbInterface,
    chainInterface;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(dbIntf, chainIntf) {
  dbInterface = dbIntf;
  chainInterface = chainIntf;

  blockchainCore.setDbInterface(dbIntf);
  blockchainCore.setChainInterface(chainIntf);
  blockchainCore.setUser(ROLES.NODE);
}

// ============================================================================================================================ //
//  processCatchedError()                                                                                                       //
// ============================================================================================================================ //
export function processCatchedError(err) {
  if(!(err instanceof CarmentisError)) {
    console.error(err);
    err = new globalError(ERRORS.GLOBAL_INTERNAL_ERROR, err.stack || [ err.toString() ]);
  }
  return err.serializeAsMessage();
}

// ============================================================================================================================ //
//  checkIncomingMicroblock()                                                                                                   //
// ============================================================================================================================ //
export async function checkIncomingMicroblock(mb) {
  let res = await processMicroblock(mb, false);

  console.log(`Received microblock ${res.mbHash} (${mb.length} bytes)`);

  res.vb.currentMicroblock.sections.forEach((section, n) => {
    console.log(
      SECTIONS.DEF[res.vb.type][section.id].label,
      `(${res.vb.currentMicroblock.object.body.sections[n].length} bytes)`
    );
  });

  return res;
}

// ============================================================================================================================ //
//  incomingMicroblockAnswer()                                                                                                  //
// ============================================================================================================================ //
export function incomingMicroblockAnswer() {
  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_OK, {});
}

// ============================================================================================================================ //
//  prepareProposal()                                                                                                           //
// ============================================================================================================================ //
export async function prepareProposal(txs) {
  let proposalTxs = [];

  for(let mb of txs) {
    try {
      await processMicroblock(mb, false);
      proposalTxs.push(mb);
    }
    catch(e) {
      console.error(e);
    }
  }

  console.log(`Created proposal with ${proposalTxs.length} microblocks`);

  return proposalTxs;
}

// ============================================================================================================================ //
//  processProposal()                                                                                                           //
// ============================================================================================================================ //
export async function processProposal(proposalTxs) {
  console.log(`Checking proposal with ${proposalTxs.length} microblocks`);

  for(let mb of proposalTxs) {
    try {
      await processMicroblock(mb, false);
    }
    catch(e) {
      console.error(e);
      return false;
    }
  }
  return true;
}

// ============================================================================================================================ //
//  finalizeBlock()                                                                                                             //
// ============================================================================================================================ //
export async function finalizeBlock(txs) {
  for(let mb of txs) {
    let res = await processMicroblock(mb, true);

    await blockchainManager.dbPut(SCHEMAS.DB_MICROBLOCK_INFO, res.mbHash, res.mbRecord);
    await blockchainManager.dbPut(SCHEMAS.DB_VB_INFO, res.mbRecord.vbHash, res.vbRecord);
    await chainInterface.writeBlock(res.mbHash, mb);
  }
}

// ============================================================================================================================ //
//  processMicroblock()                                                                                                         //
// ============================================================================================================================ //
async function processMicroblock(mb, apply) {
  let res = await blockchainManager.checkMicroblock(mb);

  for(let section of res.vb.currentMicroblock.sections) {
    await sectionCallback(res.vb, section.id, section.object, apply);
  }

  await microblockCallback(res.vb.currentMicroblock.object, apply);

  return res;
}

// ============================================================================================================================ //
//  getMicroblock()                                                                                                             //
// ============================================================================================================================ //
export async function getMicroblock(hash) {
  let mb = await loadMicroblockData(hash);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCK, mb);
}

// ============================================================================================================================ //
//  getMicroblocks()                                                                                                            //
// ============================================================================================================================ //
export async function getMicroblocks(list) {
  let mbList = [];

  for(let hash of list) {
    mbList.push(await loadMicroblockData(hash));
  }

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCKS, { list: mbList });
}

// ============================================================================================================================ //
//  getVbContent()                                                                                                              //
// ============================================================================================================================ //
export async function getVbContent(vbHash) {
  let vbContent = await blockchainCore.getVbContent(vbHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_VB_CONTENT,
    vbContent
  );
}

// ============================================================================================================================ //
//  getAccountState()                                                                                                           //
// ============================================================================================================================ //
export async function getAccountState(accountHash) {
  let state = await loadAccountState(accountHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_STATE,
    state
  );
}

// ============================================================================================================================ //
//  getAccountHistory()                                                                                                         //
// ============================================================================================================================ //
export async function getAccountHistory(accountHash) {
  let content = {
  };

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_HISTORY,
    content
  );
}

// ============================================================================================================================ //
//  loadMicroblockData()                                                                                                        //
// ============================================================================================================================ //
async function loadMicroblockData(hash) {
  let mb = await blockchainManager.chainGet(hash);

  return mb;
}

// ============================================================================================================================ //
//  sectionCallback()                                                                                                           //
// ============================================================================================================================ //
async function sectionCallback(vb, sectionId, object, apply = false) {
  switch(vb.type) {
    case ID.OBJ_ACCOUNT       : { await accountSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_VALIDATOR_NODE: { await nodeSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_ORGANIZATION  : { await organizationSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_APP_USER      : { await appUserSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_APPLICATION   : { await applicationSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_APP_LEDGER    : { await appLedgerSectionCallback(vb, sectionId, object, apply); break; }
    case ID.OBJ_ORACLE        : { await oracleSectionCallback(vb, sectionId, object, apply); break; }
  }
}

// ============================================================================================================================ //
//  microblockCallback()                                                                                                        //
// ============================================================================================================================ //
async function microblockCallback(mbObject, apply = false) {
  let fees = Math.floor(mbObject.header.gas * mbObject.header.gasPrice / 1000);

  await tokenTransfer(
    {
      type: ECO.BK_PAID_FEES,
      payerAccount: null,
      payeeAccount: null,
      amount: fees
    },
    apply
  );
}

// ============================================================================================================================ //
//  accountSectionCallback()                                                                                                    //
// ============================================================================================================================ //
async function accountSectionCallback(vb, sectionId, object, apply) {
  switch(sectionId) {
    case SECTIONS.ACCOUNT_TOKEN_ISSUANCE: {
      await tokenTransfer(
        {
          type: ECO.BK_SENT_ISSUANCE,
          payerAccount: null,
          payeeAccount: vb.id,
          amount: object.amount
        },
        apply
      );
      break;
    }

    case SECTIONS.ACCOUNT_CREATION: {
      await tokenTransfer(
        {
          type: ECO.BK_SALE,
          payerAccount: object.sellerAccount,
          payeeAccount: vb.id,
          amount: object.amount
        },
        apply
      );
      break;
    }

    case SECTIONS.ACCOUNT_TRANSFER: {
      let payeeAccount = vb.state.payees[object.payeeId];

      await tokenTransfer(
        {
          type: ECO.BK_OUTGOING_TRANSFER,
          payerAccount: vb.id,
          payeeAccount: payeeAccount,
          amount: object.amount
        },
        apply
      );
      break;
    }
  }
}

// ============================================================================================================================ //
//  nodeSectionCallback()                                                                                                       //
// ============================================================================================================================ //
async function nodeSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  organizationSectionCallback()                                                                                               //
// ============================================================================================================================ //
async function organizationSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  appUserSectionCallback()                                                                                                    //
// ============================================================================================================================ //
async function appUserSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  applicationSectionCallback()                                                                                                //
// ============================================================================================================================ //
async function applicationSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  appLedgerSectionCallback()                                                                                                  //
// ============================================================================================================================ //
async function appLedgerSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  oracleSectionCallback()                                                                                                     //
// ============================================================================================================================ //
async function oracleSectionCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  tokenTransfer()                                                                                                             //
// ============================================================================================================================ //
async function tokenTransfer(transfer, apply) {
  let accountCreation = transfer.type == ECO.BK_SENT_ISSUANCE || transfer.type == ECO.BK_SALE,
      payeeBalance,
      payerBalance,
      obj;

  if(transfer.payerAccount === null) {
    payerBalance = null;
  }
  else {
    let payerState = await loadAccountState(transfer.payerAccount);

    payerBalance = payerState.balance;

    if(payerBalance < transfer.amount) {
      throw new accountError(ERRORS.ACCOUNT_INSUFFICIENT_FUNDS);
    }
  }

  if(transfer.payeeAccount === null) {
    payeeBalance = null;
  }
  else {
    let payeeState = await loadAccountState(transfer.payeeAccount);

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
      await updateAccount(transfer.type, transfer.payerAccount, transfer.amount);

      console.log(`${transfer.payerAccount} -${transfer.amount} -> ${payerBalance - transfer.amount}`);
    }

    if(payeeBalance !== null) {
      await updateAccount(transfer.type ^ 1, transfer.payeeAccount, transfer.amount);

      console.log(`${transfer.payeeAccount} +${transfer.amount} -> ${payeeBalance + transfer.amount}`);
    }
  }
}

// ============================================================================================================================ //
//  loadAccountState()                                                                                                          //
// ============================================================================================================================ //
async function loadAccountState(accountHash) {
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
//  updateAccount()                                                                                                             //
// ============================================================================================================================ //
async function updateAccount(operationType, accountHash, amount) {
  let state = await loadAccountState(accountHash);

  state.height++;
  state.balance += operationType & ECO.BK_PLUS ? amount : -amount;

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
//  loadAccountHistory()                                                                                                        //
// ============================================================================================================================ //
async function loadAccountHistory(accountHash, historyHash) {
  let record = await dbInterface.get(SCHEMAS.DB_ACCOUNT_STATE, hash);
}

// ============================================================================================================================ //
//  addAccountHistory()                                                                                                         //
// ============================================================================================================================ //
async function addAccountHistory(accountHash, history) {
}
