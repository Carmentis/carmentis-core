import { spawn } from "child_process";
import { APP } from "./app.js";
import * as sdk from "../../sdk.js";
import * as memoryDb from "../memoryDb.js";
import { log, outcome } from "../logger.js";

const { blockchainCore, ROLES, accountVb, organizationVb, applicationVb, appLedgerVb } = sdk.blockchain;
const crypto = sdk.crypto;

export async function run() {
  const node = spawn("node", [ "../../../carmentis-test-node/node.js" ]);

  node.stdout.on("data", async (data) => {
    data = data.toString().replace(/\n$/, "");
    console.log(`(node) ${data}`);

    if(data == "ready") {
      try {
        let organization, appId;

        await accountTest();
        organization = await organizationTest();
        appId = await applicationTest(organization);
        await appLedgerTest(organization, appId);

        console.log("done");
      }
      catch(e) {
        console.error(e);
      }

      node.kill();
    }
  });

  node.stderr.on("data", (data) => {
    data = data.toString().replace(/\n$/, "");
    console.error(`(node) ${data}`);
  });

  node.on("close", (code) => {
    console.log(`node terminated`);
  });
}

async function accountTest() {
  log("--- Testing account VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode("http://127.0.0.1:3000");

  let vb, mb, transfer;

  let issuerPrivateKey = crypto.generateKey256(),
      issuerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(issuerPrivateKey),
      buyerPrivateKey = crypto.generateKey256(),
      buyerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(buyerPrivateKey);

  log("Creating root account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();

  await vb.addTokenIssuance({
    issuerPublicKey: issuerPublicKey,
    amount: 1e14
  });

  await vb.sign();

  mb = await vb.publish();

  log("Creating buyer account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  let vbHash = mb.hash;

  vb = new accountVb();

  await vb.create({
    sellerAccount: vbHash,
    buyerPublicKey: buyerPublicKey,
    amount: 1e5
  });

  await vb.sign();

  mb = await vb.publish();

  let buyerVbHash = mb.hash;

  log("Transfer from root account to buyer account");

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();
  await vb.load(vbHash);

  transfer = vb.createTransfer(buyerVbHash, 5e4);
  transfer.addPublicReference("public ref");
  transfer.addPrivateReference("private ref");
  await transfer.commit();

  await vb.sign();

  mb = await vb.publish();

  console.log(vb.state);
}

async function organizationTest() {
  log("--- Testing organization VB ----");

  let orgPrivateKey = crypto.generateKey256(),
      orgPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(orgPrivateKey);

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode("http://127.0.0.1:3000");
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

  await vb.sign();

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

async function applicationTest(organization) {
  log("--- Testing application VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode("http://127.0.0.1:3000");
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  let vb, mb;

  vb = new applicationVb();

  log("Adding declaration");

  await vb.addDeclaration({ organizationId: organization.id });

  log("Adding description");

  await vb.addDescription(APP.description);

  log("Adding definition");

  await vb.addDefinition({
    version: 1,
    definition: APP.definition
  });

  await vb.sign();

  mb = await vb.publish();

  let vbHash = mb.hash;

  vb = new applicationVb();
  await vb.load(vbHash);

  console.log("description", JSON.stringify(await vb.getDescription()));
  console.log("definition", JSON.stringify(await vb.getDefinition()));

  return vbHash;
}

async function appLedgerTest(organization, appId) {
  log("--- Testing app ledger VB ----");

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode("http://127.0.0.1:3000");
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

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

  let vb, mb;

  vb = new appLedgerVb();

  await vb.prepareUserApproval(
    {
      applicationId: appId,
      version: 1,
      fields: fields,
      actors: actors,
      channels: [
        {
          name: "mainChannel",
          keyOwner: "fileSign"
        },
//      {
//        name: "fileChannel",
//        keyOwner: "sender"
//      }
      ],
      channelInvitations: {
        sender: [
          "mainChannel"
        ],
        recipient: [
          "mainChannel"
        ]
      },
      permissions: {
        mainChannel: [ "senderDocument.*" ],
//      fileChannel: [ "senderDocument.file" ]
      },
      author: "fileSign",
      approval: {
        approver      : "sender",
        requiredFields: [ "senderDocument.file" ],
        message       : "fileSent"
      }
    }
  );

  mb = await vb.publish();
}
