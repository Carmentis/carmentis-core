import { ECO, ID, SCHEMAS, SECTIONS, ERRORS } from "../../common/constants/constants.js";
import { schemaSerializer } from "../../common/serializers/serializers.js";
import { blockchainCore, ROLES, blockchainManager, accountVb } from "../../common/blockchain/blockchain.js";
import { CarmentisError, globalError, blockchainError } from "../../common/errors/error.js";
import * as accounts from "../../common/accounts/accounts.js";
import * as util from "../../common/util/util.js";

const FEES_ENABLED = false;
const CHAIN_STATUS_KEY = "CHAIN_STATUS";

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
export async function getChainStatus(blockDelay) {
  let obj = await loadChainStatus(),
      now = util.getCarmentisTimestamp();

  let data = {
    lastBlockHeight : obj.height,
    timeToNextBlock : Math.max(0, obj.lastBlockTs + blockDelay - now),
    nSection        : obj.nSection,
    nMicroblock     : obj.nMicroblock,
    nAccountVb      : obj.objectCounters[ID.OBJ_ACCOUNT],
    nValidatorNodeVb: obj.objectCounters[ID.OBJ_VALIDATOR_NODE],
    nOrganizationVb : obj.objectCounters[ID.OBJ_ORGANIZATION],
    nAppUserVb      : obj.objectCounters[ID.OBJ_APP_USER],
    nApplicationVb  : obj.objectCounters[ID.OBJ_APPLICATION],
    nAppLedgerVb    : obj.objectCounters[ID.OBJ_APP_LEDGER],
    nOracleVb       : obj.objectCounters[ID.OBJ_ORACLE]
  };

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_CHAIN_STATUS, data, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  loadChainStatus()                                                                                                           //
// ============================================================================================================================ //
export async function loadChainStatus() {
  let obj = await blockchainManager.dbGet(SCHEMAS.DB_CHAIN, CHAIN_STATUS_KEY);

  if(!obj) {
    obj = {
      height: 0,
      lastBlockTs: util.getCarmentisTimestamp(),
      nMicroblock: 0,
      nSection: 0,
      objectCounters: Array(ID.N_OBJECTS).fill(0)
    };
  }

  return obj;
}

// ============================================================================================================================ //
//  getBlockList()                                                                                                              //
// ============================================================================================================================ //
export async function getBlockList(height, maxBlocks) {
  let list = [];

  while(height && maxBlocks--) {
    list.push(await loadBlockInfo(height--));
  }

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_BLOCK_LIST, { list: list }, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  getBlockInfo()                                                                                                              //
// ============================================================================================================================ //
export async function getBlockInfo(height) {
  let data = await loadBlockInfo(height);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_BLOCK_INFO, data, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  loadBlockInfo()                                                                                                             //
// ============================================================================================================================ //
async function loadBlockInfo(height) {
  let data = await blockchainManager.dbGet(SCHEMAS.DB_BLOCK_INFO, height);

  return {
    height: height,
    status: 0,
    ...data
  };
}

// ============================================================================================================================ //
//  getBlockContent()                                                                                                           //
// ============================================================================================================================ //
export async function getBlockContent(height) {
  let data = await loadBlockContent(height);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_BLOCK_CONTENT, data, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  loadBlockContent()                                                                                                          //
// ============================================================================================================================ //
async function loadBlockContent(height) {
  let info = await loadBlockInfo(height),
      content = await blockchainManager.dbGet(SCHEMAS.DB_BLOCK_CONTENT, height);

  return {
    timestamp     : info.timestamp,
    proposerNode  : info.proposerNode,
    previousHash  : "0".repeat(64),
    height        : height,
    merkleRootHash: "0".repeat(64),
    radixRootHash : "0".repeat(64),
    chainId       : "CarmentisTestnet",
    ...content
  };
}

// ============================================================================================================================ //
//  checkIncomingMicroblock()                                                                                                   //
// ============================================================================================================================ //
export async function checkIncomingMicroblock(mbData) {
  let context = await initializeContext(),
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
export async function prepareProposal(ts, txs) {
  let context = await initializeContext(ts),
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
export async function processProposal(ts, proposalTxs) {
  if(proposalTxs.length !== 0) {
    console.log(`Checking proposal with ${proposalTxs.length} microblock(s)`);
  }

  let context = await initializeContext(ts);

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
export async function finalizeBlock(ts, txs) {
  let context = await initializeContext(ts);

  console.log(`Finalizing block ${context.chainStatus.height + 1}`);

  let mbList = [],
      totalSize = 0;

  for(let mbData of txs) {
    let res = await processMicroblock(context, mbData, true);

    await blockchainManager.dbPut(SCHEMAS.DB_MICROBLOCK_INFO, res.mbHash, res.mbRecord);
    await blockchainManager.dbPut(SCHEMAS.DB_VB_INFO, res.mbRecord.vbHash, res.vbRecord);

    totalSize += mbData.length;

    mbList.push({
      hash    : res.mbHash,
      vbHash  : res.vb.id,
      vbType  : res.vbRecord.type,
      height  : res.vbRecord.height,
      size    : mbData.length,
      nSection: res.vb.currentMicroblock.sections.length
    });
  }

  context.chainStatus.height++;

  let blockObject = {
    hash        : "0".repeat(64),
    timestamp   : ts,
    proposerNode: "0".repeat(64),
    size        : totalSize,
    nMicroblock : mbList.length
  };

  await blockchainManager.dbPut(SCHEMAS.DB_BLOCK_INFO, context.chainStatus.height, blockObject);
  await blockchainManager.dbPut(SCHEMAS.DB_BLOCK_CONTENT, context.chainStatus.height, { microblocks: mbList });
  await blockchainManager.dbPut(SCHEMAS.DB_CHAIN, CHAIN_STATUS_KEY, context.chainStatus);

  return true;
}

// ============================================================================================================================ //
//  initializeContext()                                                                                                         //
// ============================================================================================================================ //
async function initializeContext(ts) {
  return {
    timestamp  : ts,
    chainStatus: await loadChainStatus(),
    nMicroblock: 0,
    nSection   : 0,
    fees       : 0
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

  context.chainStatus.nMicroblock++;
  context.chainStatus.nSection += sections.length;
  context.chainStatus.objectCounters[context.vb.type]++;

  for(let n in sections) {
    context.sectionIndex = +n;

    await sectionCallback(context, sections[n].id, sections[n].object, apply);
  }

  await microblockCallback(context, apply);

  return res;
}

// ============================================================================================================================ //
//  getRawMicroblock()                                                                                                          //
// ============================================================================================================================ //
export async function getRawMicroblock(hash) {
  let mb = await loadMicroblockData(hash);

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_RAW_MICROBLOCK, mb, SCHEMAS.NODE_MESSAGES);
}

// ============================================================================================================================ //
//  getRawMicroblocks()                                                                                                         //
// ============================================================================================================================ //
export async function getRawMicroblocks(list) {
  let mbList = [];

  for(let hash of list) {
    let obj = await loadMicroblockData(hash);

    mbList.push(obj);
  }

  return schemaSerializer.encodeMessage(SCHEMAS.MSG_ANS_RAW_MICROBLOCKS, { list: mbList }, SCHEMAS.NODE_MESSAGES);
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
    vbType : info.vbType,
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

  if(!apply) {
    return;
  }

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
