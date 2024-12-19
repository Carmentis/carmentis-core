import * as http from "http";
import * as memoryDb from "./memoryDb.js";
import { ID, SCHEMAS, SECTIONS, ERRORS } from "../constants/constants.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import { blockchainCore, ROLES } from "../blockchain/blockchainCore.js";
import { blockchainManager } from "../blockchain/blockchainManager.js";
import { accountVb } from "../blockchain/vb-account.js";
import { CarmentisError, globalError, blockchainError, accountError } from "../errors/error.js";

const db = {
  [ SCHEMAS.DB_MICROBLOCK_INFO ]: new Map(),
  [ SCHEMAS.DB_MICROBLOCK_DATA ]: new Map(),
  [ SCHEMAS.DB_VB_INFO         ]: new Map(),
  [ SCHEMAS.DB_BLOCK           ]: new Map()
};

const blockchain = new Map();
const accounts = new Map();

const chainInterface = {
  put: async function(hash, tx) {
    blockchain.set(hash, tx);
  },
  get: async function(hash) {
    return blockchain.get(hash);
  }
};

start();

// ============================================================================================================================ //
//  start()                                                                                                                     //
// ============================================================================================================================ //
function start() {
  console.log("starting");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setChainInterface(chainInterface);
  blockchainCore.setUser(ROLES.NODE);
  blockchainCore.setNodeCallback(callback);

  http.createServer(function(req, res) {
    let body = [];

    req.on("data", buffer => {
      body = [ ...body, ...buffer ];
    });

    req.on("end", async () => {
      let answer = await processMessage(new Uint8Array(body));

      res.end(answer);
    });
  })
  .listen(3000, function(){
    console.log("ready");
  });
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
    }
  }
  catch(e) {
    console.error(e);

    if(!(e instanceof CarmentisError)) {
      console.error(e);
      e = new globalError(ERRORS.GLOBAL_INTERNAL_ERROR, e.stack || [ e.toString() ]);
    }
    return e.serializeAsMessage();
  }

  return answer;
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
//  loadMicroblockData()                                                                                                        //
// ============================================================================================================================ //
async function loadMicroblockData(hash) {
  let mb = await chainInterface.get(hash);

  return mb;
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
