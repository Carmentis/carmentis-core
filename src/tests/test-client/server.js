import * as http from "http";
import * as fs from "fs";

import { APP_V1 } from "../test-sdk-blockchain/app-v1.js";

import * as sdk from "../../server/sdk.js";
import * as memoryDb from "../memoryDb.js";

const ORG_PRIVATE_KEY = "2B76D9AADC974CCE240359C5585997A32C05927C121F393F4AF04B9FD6B4C56A";
const NODE_URL = "http://127.0.0.1:3000";

const { ECO } = sdk.constants;

const {
  blockchainCore,
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

const PORT = 8080;
const OPERATOR_HOSTNAME = "localhost";
const OPERATOR_PORT = 3005;

http.createServer(processRequest)
  .listen(PORT, () => {
    console.log(`App is running at http://localhost:${PORT}`);
  });

function processRequest(req, res) {
  switch(req.method) {
    case "POST": {
      processPost(req, res);
      break;
    }
    case "GET": {
      processGet(req, res);
      break;
    }
  }
  res.end();
}

async function processPost(req, res) {
  switch(req.url) {
    case "/dataApproval": {
      await processDataApproval();
      break;
    }
  }
}

function processGet(req, res) {
  switch(req.url) {
    case "/": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./index.html"));
      break;
    }
    case "/appWallet.html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./appWallet.html"));
      break;
    }
    case "/extWallet.html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("./extWallet.html"));
      break;
    }
    case "/carmentis-sdk.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("../../../dist/client/index.js"));
      break;
    }
    case "/main.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./main.js"));
      break;
    }
    case "/appWallet.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./appWallet.js"));
      break;
    }
    case "/extWallet.js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync("./extWallet.js"));
      break;
    }
  }
}

async function processDataApproval() {
  let organization = await publishOrganization(ORG_PRIVATE_KEY),
      applicationId = await publishApplication(organization);

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
    applicationId: applicationId,
    version: 1,
    fields: fields,
    actors: actors,
    channels: [
      {
        name: "mainChannel",
        keyOwner: "fileSign"
      }
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
      mainChannel: [ "senderDocument.*" ]
    },
    author: "fileSign",
    approval: {
      endorser      : "sender",
      requiredFields: [ "senderDocument.file" ],
      message       : "fileSent"
    }
  };

  await operatorQuery(
    "prepareUserApproval",
    approvalObject
  );
}

async function publishOrganization(orgPrivateKey) {
  let orgPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(orgPrivateKey);

  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, orgPrivateKey);

  let vb, mb;

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

  mb = await vb.publish();

  return {
    id: mb.hash,
    publicKey : orgPublicKey,
    privateKey: orgPrivateKey
  };
}

async function publishApplication(organization) {
  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  let vb, mb;

  vb = new applicationVb();

  await vb.addDeclaration({ organizationId: organization.id });

  await vb.addDescription(APP_V1.description);

  await vb.addDefinition({
    version: 1,
    definition: APP_V1.definition
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();

  return mb.hash;
}

async function operatorQuery(method, data) {
  return new Promise(function(resolve, reject) {
    let options = {
      hostname: OPERATOR_HOSTNAME,
      port    : OPERATOR_PORT,
      path    : "/" + method,
      method  : "POST"
    };

    let req = http.request(options, res => {
      res.on("data", answer => {
        let obj = JSON.parse(answer.toString());
        resolve(obj);
      });
    });

    req.on("error", answer => {
      console.error(answer);
      reject(answer);
    });

    req.write(
      Buffer.from(JSON.stringify(data))
    );
    req.end();
  });
}
