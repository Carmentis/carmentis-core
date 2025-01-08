import * as sdk from "../sdk.js";

const { ID, SCHEMAS, SECTIONS, ERRORS } = sdk.constants;
const { schemaSerializer } = sdk.serializers;
const { blockchainCore, ROLES, blockchainManager, accountVb } = sdk.blockchain;
const { CarmentisError, globalError, blockchainError, accountError } = sdk.errors;

const accounts = new Map();

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(dbInterface, chainInterface) {
  blockchainCore.setDbInterface(dbInterface);
  blockchainCore.setChainInterface(chainInterface);
  blockchainCore.setUser(ROLES.NODE);
  blockchainCore.setNodeCallback(callback);
}

// ============================================================================================================================ //
//  processMessage()                                                                                                            //
// ============================================================================================================================ //
export async function processMessage(msg) {
  let answer;

  try {
    let [ id, object ] = schemaSerializer.decodeMessage(msg);

    console.log("processMessage", SCHEMAS.MSG_NAMES[id]);

    switch(id) {
      case SCHEMAS.MSG_SEND_MICROBLOCK: {
        answer = await checkTx(object.data);
        break;
      }
      case SCHEMAS.MSG_GET_MICROBLOCK: {
        answer = await getMicroblock(object.hash);
        break;
      }
      case SCHEMAS.MSG_GET_MICROBLOCKS: {
        answer = await getMicroblocks(object.list);
        break;
      }
      case SCHEMAS.MSG_GET_VB_CONTENT: {
        answer = await getVbContent(object.vbHash);
        break;
      }
      case SCHEMAS.MSG_GET_ACCOUNT_BALANCE: {
        answer = await getAccountBalance(object.accountHash);
        break;
      }
      case SCHEMAS.MSG_GET_ACCOUNT_HISTORY: {
        answer = await getAccountHistory(object.accountHash);
        break;
      }
    }
  }
  catch(err) {
    console.error(err);

    if(!(err instanceof CarmentisError)) {
      console.error(err);
      err = new globalError(ERRORS.GLOBAL_INTERNAL_ERROR, err.stack || [ err.toString() ]);
    }
    return err.serializeAsMessage();
  }

  return answer;
}

// ============================================================================================================================ //
//  checkTx()                                                                                                                   //
// ============================================================================================================================ //
async function checkTx(tx) {
  let res = await blockchainManager.addMicroblock(tx);

  console.log(`New microblock ${res.mbHash} (${tx.length} bytes)`);

  res.vb.currentMicroblock.sections.forEach((section, n) => {
    console.log(
      SECTIONS.DEF[res.vb.type][section.id].label,
      `(${res.vb.currentMicroblock.object.body.sections[n].length} bytes)`
    );
  });

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_OK, {});
}

// ============================================================================================================================ //
//  getMicroblock()                                                                                                             //
// ============================================================================================================================ //
async function getMicroblock(hash) {
  let mb = await loadMicroblockData(hash);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCK, mb);
}

// ============================================================================================================================ //
//  getMicroblocks()                                                                                                            //
// ============================================================================================================================ //
async function getMicroblocks(list) {
  let mbList = [];

  for(let hash of list) {
    mbList.push(await loadMicroblockData(hash));
  }

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCKS, { list: mbList });
}

// ============================================================================================================================ //
//  getVbContent()                                                                                                              //
// ============================================================================================================================ //
async function getVbContent(vbHash) {
  let vbContent = await blockchainCore.getVbContent(vbHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_VB_CONTENT,
    vbContent
  );
}

// ============================================================================================================================ //
//  getAccountBalance()                                                                                                         //
// ============================================================================================================================ //
async function getAccountBalance(accountHash) {
  if(!accounts.has(accountHash)) {
    throw new accountError(ERRORS.ACCOUNT_UNKNOWN, accountHash);
  }

  let balance = accounts.get(accountHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_BALANCE,
    {
      balance: balance
    }
  );
}

// ============================================================================================================================ //
//  getAccountHistory()                                                                                                         //
// ============================================================================================================================ //
async function getAccountHistory(accountHash) {
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
//  callback()                                                                                                                  //
// ============================================================================================================================ //
async function callback(vb, sectionId, object) {
  switch(vb.type) {
    case ID.OBJ_ACCOUNT       : { await accountCallback(vb, sectionId, object); break; }
    case ID.OBJ_VALIDATOR_NODE: { await nodeCallback(vb, sectionId, object); break; }
    case ID.OBJ_ORGANIZATION  : { await organizationCallback(vb, sectionId, object); break; }
    case ID.OBJ_APP_USER      : { await appUserCallback(vb, sectionId, object); break; }
    case ID.OBJ_APPLICATION   : { await applicationCallback(vb, sectionId, object); break; }
    case ID.OBJ_APP_LEDGER    : { await appLedgerCallback(vb, sectionId, object); break; }
    case ID.OBJ_ORACLE        : { await oracleCallback(vb, sectionId, object); break; }
  }
}

// ============================================================================================================================ //
//  accountCallback()                                                                                                           //
// ============================================================================================================================ //
async function accountCallback(vb, sectionId, object) {
  switch(sectionId) {
    case SECTIONS.ACCOUNT_TOKEN_ISSUANCE: {
      await tokenTransfer(null, vb.id, object.amount, true);
      break;
    }

    case SECTIONS.ACCOUNT_CREATION: {
      await tokenTransfer(object.sellerAccount, vb.id, object.amount, true);
      break;
    }

    case SECTIONS.ACCOUNT_TRANSFER: {
      let payeeAccount = vb.state.payees[object.payeeId];

      await tokenTransfer(vb.id, payeeAccount, object.amount);
      break;
    }
  }
}

// ============================================================================================================================ //
//  nodeCallback()                                                                                                              //
// ============================================================================================================================ //
async function nodeCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  organizationCallback()                                                                                                      //
// ============================================================================================================================ //
async function organizationCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  appUserCallback()                                                                                                           //
// ============================================================================================================================ //
async function appUserCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  applicationCallback()                                                                                                       //
// ============================================================================================================================ //
async function applicationCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  appLedgerCallback()                                                                                                         //
// ============================================================================================================================ //
async function appLedgerCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  oracleCallback()                                                                                                            //
// ============================================================================================================================ //
async function oracleCallback(vb, sectionId, object) {
}

// ============================================================================================================================ //
//  tokenTransfer()                                                                                                             //
// ============================================================================================================================ //
async function tokenTransfer(payerAccount, payeeAccount, amount, creation = false) {
  if(payerAccount !== null) {
    let payerBalance = accounts.get(payerAccount);

    if(payerBalance == undefined || payerBalance < amount) {
      throw new accountError(ERRORS.ACCOUNT_INSUFFICIENT_FUNDS);
    }

    payerBalance -= amount;
    accounts.set(payerAccount, payerBalance);

    console.log(`${payerAccount} -${amount} -> ${payerBalance}`);
  }

  let payeeBalance = accounts.get(payeeAccount);

  if(creation){
    if(payeeBalance != undefined) {
      throw new accountError(ERRORS.ACCOUNT_ALREADY_CREATED, payeeAccount);
    }
    payeeBalance = 0;
  }
  else {
    if(payeeBalance == undefined) {
      throw new accountError(ERRORS.ACCOUNT_INVALID_PAYEE, payeeAccount);
    }
  }

  payeeBalance += amount;
  accounts.set(payeeAccount, payeeBalance);

  console.log(`${payeeAccount} +${amount} -> ${payeeBalance}`);
}
