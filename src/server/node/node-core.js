import { ECO, ID, SCHEMAS, SECTIONS, ERRORS } from "../../common/constants/constants.js";
import { schemaSerializer } from "../../common/serializers/serializers.js";
import { blockchainCore, ROLES, blockchainManager, accountVb } from "../../common/blockchain/blockchain.js";
import { CarmentisError, globalError, blockchainError } from "../../common/errors/error.js";
import * as accounts from "../../common/accounts/accounts.js";

const FEES_ENABLED = false;

let dbInterface;

// ============================================================================================================================ //
//  initialize()                                                                                                                //
// ============================================================================================================================ //
export function initialize(dbIntf, chainIntf) {
  dbInterface = dbIntf;

  accounts.setDbInterface(dbIntf);

  blockchainCore.setDbInterface(dbIntf);
  blockchainCore.setChainInterface(chainIntf);
  blockchainCore.setUser(ROLES.NODE);
}

// ============================================================================================================================ //
//  processCatchedError()                                                                                                       //
// ============================================================================================================================ //
export function processCatchedError(err) {
  if(!(err instanceof CarmentisError)) {
    err = new globalError(ERRORS.GLOBAL_INTERNAL_ERROR, err.stack || [ err.toString() ]);
  }

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ERROR,
    {
      error: {
        type: err.type,
        id  : err.id,
        arg : err.arg.map(String)
      }
    },
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getChainStatus()                                                                                                            //
// ============================================================================================================================ //
export async function getChainStatus() {
  let data = {
    lastBlockHeight : 0,
    timeToNextBlock : 0,
    nSection        : 0,
    nMicroblock     : 0,
    nAccountVb      : 0,
    nValidatorNodeVb: 0,
    nOrganizationVb : 0,
    nAppUserVb      : 0,
    nApplicationVb  : 0,
    nAppLedgerVb    : 0,
    nOracleVb       : 0
  };

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_CHAIN_STATUS, data, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  checkIncomingMicroblock()                                                                                                   //
// ============================================================================================================================ //
export async function checkIncomingMicroblock(mbData) {
  let context = initializeContext(),
      res = await processMicroblock(context, mbData, false),
      mb = res.vb.currentMicroblock;

  console.log(`Received${res.vbRecord.height == 1 ? " genesis" : ""} microblock ${res.mbHash} (${mbData.length} bytes)`);

  if(res.vbRecord.height > 1) {
    console.log(`Belonging to VB ${res.vb.id}`);
  }

  if(FEES_ENABLED) {
    let payerAccount;

    if(mb.payerAccount) {
      payerAccount = mb.payerAccount;
    }
    else if(mb.payerPublicKey) {
      payerAccount = await accounts.loadAccountByPublicKey(mb.payerPublicKey);
    }

    if(!payerAccount) {
      throw "Unable to find the payer account";
    }

    let fees = computeFees(mb);

    console.log(`Fees: ${fees}, to be paid by ${payerAccount}`);
  }

  mb.sections.forEach((section, n) => {
    console.log(
      SECTIONS.DEF[res.vb.type][section.id].label,
      `(${mb.object.body.sections[n].length} bytes)`
    );
  });

  return res;
}

// ============================================================================================================================ //
//  incomingMicroblockAnswer()                                                                                                  //
// ============================================================================================================================ //
export function incomingMicroblockAnswer() {
  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_OK, {}, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  prepareProposal()                                                                                                           //
// ============================================================================================================================ //
export async function prepareProposal(height, ts, txs) {
  let context = initializeContext(height, ts),
      proposalTxs = [];

  for(let mbData of txs) {
    try {
      await processMicroblock(context, mbData, false);
      proposalTxs.push(mbData);
    }
    catch(e) {
      console.error(e);
    }
  }

  if (proposalTxs.length !== 0) {
    console.log(`Created proposal with ${proposalTxs.length} microblock(s)`);
  }

  return proposalTxs;
}

// ============================================================================================================================ //
//  processProposal()                                                                                                           //
// ============================================================================================================================ //
export async function processProposal(height, ts, proposalTxs) {
  if(proposalTxs.length !== 0) {
    console.log(`Checking proposal with ${proposalTxs.length} microblock(s)`);
  }

  let context = initializeContext(height, ts);

  for(let mbData of proposalTxs) {
    try {
      await processMicroblock(context, mbData, false);
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
export async function finalizeBlock(height, ts, txs) {
  console.log(`Finalizing block ${height}`);

  let context = initializeContext(height, ts);

  for(let mbData of txs) {
    let res = await processMicroblock(context, mbData, true);

    await blockchainManager.dbPut(SCHEMAS.DB_MICROBLOCK_INFO, res.mbHash, res.mbRecord);
    await blockchainManager.dbPut(SCHEMAS.DB_VB_INFO, res.mbRecord.vbHash, res.vbRecord);
  }
  return true;
}

// ============================================================================================================================ //
//  initializeContext()                                                                                                         //
// ============================================================================================================================ //
function initializeContext(height, ts) {
  return {
    height: height,
    timestamp: ts,
    fees: 0
  };
}

// ============================================================================================================================ //
//  processMicroblock()                                                                                                         //
// ============================================================================================================================ //
async function processMicroblock(context, mbData, apply) {
  let res = await blockchainManager.checkMicroblock(mbData),
      sections = res.vb.currentMicroblock.sections;

  context.vb = res.vb;
  context.mb = res.vb.currentMicroblock;

  for(let n in sections) {
    context.sectionIndex = +n;

    await sectionCallback(context, sections[n].id, sections[n].object, apply);
  }

  await microblockCallback(context, apply);

  return res;
}

// ============================================================================================================================ //
//  getMicroblock()                                                                                                             //
// ============================================================================================================================ //
export async function getMicroblock(hash) {
  let mb = await loadMicroblockData(hash);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCK, mb, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  getMicroblocks()                                                                                                            //
// ============================================================================================================================ //
export async function getMicroblocks(list) {
  let mbList = [];

  for(let hash of list) {
    let obj = await loadMicroblockData(hash);
    mbList.push(obj.content);
  }

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_MICROBLOCKS, { list: mbList }, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  getVbInfo()                                                                                                                 //
// ============================================================================================================================ //
export async function getVbInfo(vbHash) {
  let vbInfo = await blockchainCore.getVbInfo(vbHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_VB_INFO,
    vbInfo,
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getVbContent()                                                                                                              //
// ============================================================================================================================ //
export async function getVbContent(vbHash) {
  let vbContent = await blockchainCore.getVbContent(vbHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_VB_CONTENT,
    vbContent,
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getAccountState()                                                                                                           //
// ============================================================================================================================ //
export async function getAccountState(accountHash) {
  let state = await accounts.loadState(accountHash);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_STATE,
    state,
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getAccountHistory()                                                                                                         //
// ============================================================================================================================ //
export async function getAccountHistory(accountHash, lastHistoryHash, maxRecords) {
  let history = await accounts.loadHistory(accountHash, lastHistoryHash, maxRecords);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_HISTORY,
    history,
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getObjectList()                                                                                                             //
// ============================================================================================================================ //
export async function getObjectList(tableId) {
  let list = await dbInterface.getKeys(tableId);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_OBJECT_LIST,
    { list: list },
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  getAccountByPublicKey()                                                                                                     //
// ============================================================================================================================ //
export async function getAccountByPublicKey(publicKey) {
  let accountHash = await accounts.loadAccountByPublicKey(publicKey);

  return schemaSerializer.encodeMessage(
    SCHEMAS.MSG_ANS_ACCOUNT_BY_PUBLIC_KEY,
    { accountHash: accountHash },
    SCHEMAS.NODE_MESSAGES
  );
}

// ============================================================================================================================ //
//  loadMicroblockData()                                                                                                        //
// ============================================================================================================================ //
async function loadMicroblockData(hash) {
  let info = await blockchainManager.dbGet(SCHEMAS.DB_MICROBLOCK_INFO, hash);  
  let content = await blockchainManager.chainGet(hash);

  let answer = {
    vbHash : info.vbHash,
    type   : info.vbType,
    block  : info.block,
    index  : info.index,
    content: content
  };

  return answer;
}

// ============================================================================================================================ //
//  sectionCallback()                                                                                                           //
// ============================================================================================================================ //
async function sectionCallback(context, sectionId, object, apply = false) {
  switch(context.vb.type) {
    case ID.OBJ_ACCOUNT       : { await accountSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_VALIDATOR_NODE: { await nodeSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_ORGANIZATION  : { await organizationSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_APP_USER      : { await appUserSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_APPLICATION   : { await applicationSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_APP_LEDGER    : { await appLedgerSectionCallback(context, sectionId, object, apply); break; }
    case ID.OBJ_ORACLE        : { await oracleSectionCallback(context, sectionId, object, apply); break; }
  }
}

// ============================================================================================================================ //
//  microblockCallback()                                                                                                        //
// ============================================================================================================================ //
async function microblockCallback(context, apply = false) {
  let fees = computeFees(context.mb);

  context.fees += fees;

  await accounts.tokenTransfer(
    {
      type: ECO.BK_PAID_FEES,
      payerAccount: null,
      payeeAccount: null,
      amount: fees
    },
    {
      mbHash: context.mb.hash
    },
    context.timestamp,
    apply
  );

  if(!context.vb.microblocks.length) {
    switch(context.vb.type) {
      case ID.OBJ_ACCOUNT: {
        await blockchainManager.dbPut(SCHEMAS.DB_ACCOUNTS, context.vb.id, {});
        break;
      }
      case ID.OBJ_VALIDATOR_NODE: {
        await blockchainManager.dbPut(SCHEMAS.DB_VALIDATOR_NODES, context.vb.id, {});
        break;
      }
      case ID.OBJ_ORGANIZATION: {
        await blockchainManager.dbPut(SCHEMAS.DB_ORGANIZATIONS, context.vb.id, {});
        break;
      }
      case ID.OBJ_APPLICATION: {
        await blockchainManager.dbPut(SCHEMAS.DB_APPLICATIONS, context.vb.id, {});
        break;
      }
      case ID.OBJ_ORACLE: {
        await blockchainManager.dbPut(SCHEMAS.DB_ORACLES, context.vb.id, {});
        break;
      }
    }
  }
}

// ============================================================================================================================ //
//  computeFees()                                                                                                               //
// ============================================================================================================================ //
function computeFees(mb) {
  return Math.floor(mb.object.header.gas * mb.object.header.gasPrice / 1000);
}

// ============================================================================================================================ //
//  accountSectionCallback()                                                                                                    //
// ============================================================================================================================ //
async function accountSectionCallback(context, sectionId, object, apply) {
  switch(sectionId) {
    case SECTIONS.ACCOUNT_TOKEN_ISSUANCE: {
      await accounts.testPublicKeyAvailability(object.issuerPublicKey);

      await accounts.tokenTransfer(
        {
          type        : ECO.BK_SENT_ISSUANCE,
          payerAccount: null,
          payeeAccount: context.vb.id,
          amount      : object.amount
        },
        {
          mbHash: context.mb.hash,
          sectionIndex: context.sectionIndex
        },
        context.timestamp,
        apply
      );
      if(apply) {
        await accounts.saveAccountByPublicKey(context.vb.id, object.issuerPublicKey);
      }
      break;
    }

    case SECTIONS.ACCOUNT_CREATION: {
      await accounts.testPublicKeyAvailability(object.buyerPublicKey);

      await accounts.tokenTransfer(
        {
          type        : ECO.BK_SALE,
          payerAccount: object.sellerAccount,
          payeeAccount: context.vb.id,
          amount      : object.amount
        },
        {
          mbHash: context.mb.hash,
          sectionIndex: context.sectionIndex
        },
        context.timestamp,
        apply
      );
      if(apply) {
        await accounts.saveAccountByPublicKey(context.vb.id, object.buyerPublicKey);
      }
      break;
    }

    case SECTIONS.ACCOUNT_TRANSFER: {
      await accounts.tokenTransfer(
        {
          type        : ECO.BK_SENT_PAYMENT,
          payerAccount: context.vb.id,
          payeeAccount: object.account,
          amount      : object.amount
        },
        {
          mbHash: context.mb.hash,
          sectionIndex: context.sectionIndex
        },
        context.timestamp,
        apply
      );
      break;
    }
  }
}

// ============================================================================================================================ //
//  nodeSectionCallback()                                                                                                       //
// ============================================================================================================================ //
async function nodeSectionCallback(context, sectionId, object) {
}

// ============================================================================================================================ //
//  organizationSectionCallback()                                                                                               //
// ============================================================================================================================ //
async function organizationSectionCallback(context, sectionId, object) {
}

// ============================================================================================================================ //
//  appUserSectionCallback()                                                                                                    //
// ============================================================================================================================ //
async function appUserSectionCallback(context, sectionId, object) {
}

// ============================================================================================================================ //
//  applicationSectionCallback()                                                                                                //
// ============================================================================================================================ //
async function applicationSectionCallback(context, sectionId, object) {
}

// ============================================================================================================================ //
//  appLedgerSectionCallback()                                                                                                  //
// ============================================================================================================================ //
async function appLedgerSectionCallback(context, sectionId, object) {
}

// ============================================================================================================================ //
//  oracleSectionCallback()                                                                                                     //
// ============================================================================================================================ //
async function oracleSectionCallback(context, sectionId, object) {
}
