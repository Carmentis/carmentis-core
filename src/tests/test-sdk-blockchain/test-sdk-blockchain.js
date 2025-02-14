import { APP_V1 } from "./app-v1.js";
import { APP_V2 } from "./app-v2.js";
import { APPROVAL_MONO_CHANNEL, APPROVAL_MULTI_CHANNEL } from "./approval.js";
import { ORACLE } from "./oracle.js";

import { spawn } from "child_process";
import * as sdk from "../../server/sdk.js";
import * as memoryDb from "../memoryDb.js";
import { log, outcome } from "../logger.js";

const AUTO_NODE_START = false;
const PATH_TO_NODE = "../../../carmentis-dev-node/dev-node.js";
const NODE_URL = "http://localhost:3000";

const { ECO } = sdk.constants;

const {
  blockchainCore,
  blockchainManager,
  blockchainQuery,
  microblock,
  ROLES,
  accountVb,
  organizationVb,
  applicationVb,
  oracleVb,
  appLedgerVb
} = sdk.blockchain;

const crypto = sdk.crypto;

export async function run() {
  if(AUTO_NODE_START) {
    return new Promise(function(resolve, reject) {
      const node = spawn("node", [ PATH_TO_NODE ]);

      node.stdout.on("data", async (data) => {
        data = data.toString().replace(/\n$/, "");
        console.log(`(node) ${data.split(/\r?\n/).join("\n(node) ")}`);

        if(/^Carmentis node is ready/.test(data)) {
          await runTests();
          node.kill();
        }
      });

      node.stderr.on("data", (data) => {
        data = data.toString().replace(/\n$/, "");
        console.error(`(node) ${data.split(/\r?\n/).join("\n(node) ")}`);
      });

      node.on("close", (code) => {
        console.log(`node terminated`);
        resolve();
      });
    });
  }
  else {
    await runTests();
  }
}

async function runTests() {
  try {
    let accountVbHash, organization, appId, oracleId;

    accountVbHash = await accountTest();
    await blockchainQueryTest(accountVbHash);
    organization = await organizationTest();
    appId = await applicationTest(organization);
    oracleId = await oracleTest(organization, appId);
    await appLedgerTest(organization, appId);
  }
  catch(e) {
    console.error(e);
  }
}

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
async function accountTest() {
  log("--- Testing account VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);

  let vb, mb, transfer, answer;

  let issuerPrivateKey = crypto.generateKey256(),
      issuerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(issuerPrivateKey),
      buyerPrivateKey = crypto.generateKey256(),
      buyerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(buyerPrivateKey);

  log("Creating root account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();

  await vb.addTokenIssuance({
    issuerPublicKey: issuerPublicKey,
    amount: ECO.INITIAL_OFFER
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  log("Creating buyer account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  let rootAccountVbHash = mb.hash;

  vb = new accountVb();

  await vb.create({
    sellerAccount: rootAccountVbHash,
    buyerPublicKey: buyerPublicKey,
    amount: 10 * ECO.TOKEN
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  let buyerAccountVbHash = mb.hash;

  log("Transfer from root account to buyer account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();
  await vb.load(rootAccountVbHash);

  transfer = vb.createTransfer(buyerAccountVbHash, 5 * ECO.TOKEN);
  transfer.addPublicReference("public ref");
  transfer.addPrivateReference("private ref");
  await transfer.commit();

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  for(let accountHash of [ rootAccountVbHash, buyerAccountVbHash ]) {
    answer = await blockchainQuery.getVirtualBlockchainContent(accountHash);
    console.log(answer);
    let mbAnswer = await blockchainQuery.getMicroblocks(answer.list);

    console.log(
      mbAnswer.map(obj => {
        let mb = new microblock(sdk.constants.ID.OBJ_ACCOUNT);
        mb.load(obj.content, obj.hash);
        return JSON.stringify(mb.sections, null, 2);
      })
    );
  }

  log("Second transfer from root account to buyer account");

  vb = new accountVb();
  await vb.load(rootAccountVbHash);

  transfer = vb.createTransfer(buyerAccountVbHash, 2 * ECO.TOKEN);
  transfer.addPublicReference("public ref");
  transfer.addPrivateReference("private ref");
  await transfer.commit();

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  log("Fetching account data");

  answer = await blockchainQuery.getAccountState(rootAccountVbHash);
  answer = await blockchainQuery.getAccountHistory(rootAccountVbHash, answer.lastHistoryHash);
  showAccountHistory(rootAccountVbHash, answer);

  answer = await blockchainQuery.getAccountState(buyerAccountVbHash);
  answer = await blockchainQuery.getAccountHistory(buyerAccountVbHash, answer.lastHistoryHash);
  showAccountHistory(buyerAccountVbHash, answer);

  answer = await blockchainQuery.getAccountByPublicKey(issuerPublicKey);
  console.log(`Account by public key: ${issuerPublicKey} -> ${answer}`);

  answer = await blockchainQuery.getAccountByPublicKey(buyerPublicKey);
  console.log(`Account by public key: ${buyerPublicKey} -> ${answer}`);

  try {
    answer = await blockchainQuery.getAccountByPublicKey(sdk.constants.DATA.NULL_HASH);
    console.log(`Account by public key: ${buyerPublicKey} -> ${answer}`);
  }
  catch(e) {
    console.log("catch()");
  }
  console.log("done");

  return rootAccountVbHash;
}

function showAccountHistory(accountHash, list) {
  console.log(`\n--- Account history (${accountHash})\n`);
  console.log(`${"Date".padEnd(25)}| ${"Operation type".padEnd(23)}| ${"Linked account".padEnd(65)}| Amount (CMTS)`);
  console.log(`${"-".repeat(25)}+${"-".repeat(24)}+${"-".repeat(66)}+${"-".repeat(15)}`);

  list.forEach(entry => {
    console.log(
      [
        entry.timestamp.toJSON(),
        entry.name.padEnd(22),
        entry.linkedAccount,
        ((entry.amount < 0 ? "" : "+") + (entry.amount / ECO.TOKEN).toFixed(2)).padEnd(14)
      ].join(" | ")
    );
  });
  console.log();
}

// ============================================================================================================================ //
//  blockchainQuery                                                                                                             //
// ============================================================================================================================ //
async function blockchainQueryTest(vbHash) {
  log("--- Testing blockchainQuery methods ----");

  blockchainCore.setNode(NODE_URL);

  let content;

  console.log("Retrieving chain status");

  content = await blockchainQuery.getChainStatus();

  console.log(content);

  console.log("Retrieving raw microblock");

  content = await blockchainQuery.getMicroblock(vbHash);

  console.log(content);

  let mb = new microblock(sdk.constants.ID.OBJ_ACCOUNT);
  await mb.load(content, vbHash);
  console.log(mb);

  console.log("Retrieving accounts");

  content = await blockchainQuery.getAccounts();

  console.log(content);
}

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
async function organizationTest() {
  log("--- Testing organization VB ----");

  let orgPrivateKey = crypto.generateKey256(),
      orgPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(orgPrivateKey);

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, orgPrivateKey);

  let vb, mb;

  log("Creating organization VB");

  vb = new organizationVb();

  await vb.addPublicKey({
    publicKey: orgPublicKey
  });

  await vb.addDescription({
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "UK",
    website: "www.carmentis.io"
  });

  await vb.addServer({
    endpoint: "https://foo.bar"
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);

  let price = await vb.computePrice();

  console.log("Price:", price);

  mb = await vb.publish();

  let vbHash = mb.hash;

  log(await vb.getDescription());

  log("Adding new description");

  vb = new organizationVb();
  await vb.load(vbHash);

  await vb.addDescription({
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "US",
    website: "www.carmentis.io"
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  log(await vb.getDescription());

  log("Adding new description");

  vb = new organizationVb();

  await vb.load(vbHash);

  vb = new organizationVb();
  await vb.load(vbHash);

  await vb.addDescription({
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "FR",
    website: "www.carmentis.io"
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  console.log(await vb.getDescription());

  vb = new organizationVb();
  await vb.load(vbHash);

  console.log(await vb.getDescription());

  return {
    id: vbHash,
    publicKey : orgPublicKey,
    privateKey: orgPrivateKey
  };
}

// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //
async function applicationTest(organization) {
  log("--- Testing application VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  let vb, mb;

  vb = new applicationVb();

  log("Adding declaration");

  await vb.addDeclaration({ organizationId: organization.id });

  log("Adding description");

  await vb.addDescription(APP_V1.description);

  log("Adding definition");

  await vb.addDefinition({
    version: 1,
    definition: APP_V1.definition
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  let vbHash = mb.hash;

  vb = new applicationVb();
  await vb.load(vbHash);

  console.log("Updating description");

  await vb.addDescription(APP_V2.description);

  console.log("Updating definition");

  await vb.addDefinition({
    version: 2,
    definition: APP_V2.definition
  });

  console.log("Signing");

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  vb = new applicationVb();
  await vb.load(vbHash);

  console.log("description", JSON.stringify(await vb.getDescription()));
  console.log("definition", JSON.stringify(await vb.getDefinition()));

  return vbHash;
}

// ============================================================================================================================ //
//  Oracle                                                                                                                      //
// ============================================================================================================================ //
async function oracleTest(organization, appId) {
  log("--- Testing oracle VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  let vb, mb;

  vb = new oracleVb();

  log("Adding declaration");

  await vb.addDeclaration({ organizationId: organization.id });

  log("Adding description");

  await vb.addDescription(ORACLE.description);

  log("Adding definition");

  await vb.addDefinition({
    version: 1,
    definition: ORACLE.definition
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  let vbHash = mb.hash;

  log("Encoding service request");

  vb = new oracleVb();
  await vb.load(vbHash);

  let dataObject = {
    publicKey: "55AA".repeat(16),
    email: "foo@bar.com"
  };

  let data = await vb.encodeServiceRequest(1, "verifyEmail", dataObject, organization.id, organization.privateKey);

  console.log(data);

  let body = oracleVb.decodeServiceRequestBody(data.request.body);

  vb = new oracleVb();
  await vb.load(body.oracleId);

  dataObject = await vb.decodeServiceRequest(1, "verifyEmail", data.request);

  console.log(dataObject);
}

// ============================================================================================================================ //
//  App Ledger                                                                                                                  //
// ============================================================================================================================ //
async function appLedgerTest(organization, appId) {
  log("--- Testing app ledger VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  log("Generating microblock");

  let fields = {
    transactionId: "FS1234",
    senderDocument: {
      file: {
        name  : "test.txt",
        size  : 123,
        crc32 : "A0A1A2A3",
        sha256: "AA55".repeat(16)
      },
      senderEmail   : "foo@carmentis.io",
      recipientEmail: "bar@carmentis.io"
    }
  };

  let actors = [
    {
      name: "fileSign",
      type: "applicationOwner"
    },
    {
      name: "sender",
      type: "endUser"
    },
    {
      name: "recipient",
      type: "endUser"
    }
  ];

  let approvalObject = {
    applicationId: appId,
    version: 1,
    fields: fields,
    actors: actors,

    ...APPROVAL_MULTI_CHANNEL,

    author: "fileSign",

    approval: {
      endorser: "sender",
      message : "fileSent"
    }
  };

  let vb, mb;

  vb = new appLedgerVb();

  if(approvalObject.appLedgerId) {
    await vb.load(approvalObject.appLedgerId);
  }

  let endorserActorPrivateKey = crypto.generateKey256(),
      endorserActorPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(endorserActorPrivateKey);

  if(!vb.isEndorserSubscribed(approvalObject.approval.endorser)) {
    vb.setEndorserActorPublicKey(endorserActorPublicKey);
  }

  await vb.generateDataSections(approvalObject);

  mb = vb.getMicroblockData();

  console.log(mb);

  let binaryData = vb.currentMicroblock.binary;

  log("Importing microblock");

  blockchainCore.setUser(ROLES.USER, endorserActorPrivateKey);

  let res = await blockchainManager.checkMicroblock(
    vb.currentMicroblock.binary,
    {
      ignoreGas: true
    }
  );

  console.log(res.vb.currentMicroblock.sections);
}
