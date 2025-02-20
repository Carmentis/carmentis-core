import * as http from "http";
import * as fs from "fs";

import { APP_V1 } from "../test-sdk-blockchain/app-v1.js";
import { ORACLE } from "../test-sdk-blockchain/oracle.js";

import * as sdk from "../../server/sdk.js";
import * as memoryDb from "../memoryDb.js";

const PORT = 8080;

const APP_PRIVATE_KEY    = "2B76D9AADC974CCE240359C5585997A32C05927C121F393F4AF04B9FD6B4C56A";
const ORACLE_PRIVATE_KEY = "ADDA4B6E6072FC8E31815C4F0E24D6668CAC6BAE5536D9192D671AC79CC23B24";

const NODE_URL            = "http://localhost:3000";
const APP_OPERATOR_URL    = "http://localhost:3005";
const ORACLE_OPERATOR_URL = "http://localhost:3006";

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

let applicationId, oracleId;

http.createServer(processRequest)
  .listen(PORT, () => {
    console.log(`App is running at http://localhost:${PORT}`);
  });

async function processRequest(req, res) {
  switch(req.method) {
    case "POST": {
      await processPost(req, res);
      break;
    }
    case "GET": {
      await processGet(req, res);
      break;
    }
  }
  res.end();
}

async function processPost(req, res) {
  let answer;

  console.log("received POST request " + req.url);

  switch(req.url) {
    case "/genesis": {
      answer = await genesis(res);
      break;
    }
    case "/publishObjects": {
      answer = await publishObjects(res);
      break;
    }
    case "/dataApproval": {
      answer = await processDataApproval(res);
      break;
    }
    case "/oracleRequest": {
      answer = await processOracleRequest(res);
      break;
    }
  }

  res.writeHead(200, { "Content-Type": "application/json" });
  res.write(JSON.stringify(answer));
}

function processGet(req, res) {
  let url = req.url;

  if(url == "/") {
    url = "/index.html";
  }

  let ext = url.split(".").pop();

  switch(ext) {
    case "html": {
      res.writeHead(200, { "Content-Type": "text/html" });
      res.write(fs.readFileSync("." + url));
      break;
    }
    case "js": {
      res.writeHead(200, { "Content-Type": "text/javascript" });
      res.write(fs.readFileSync(url == "/carmentis-sdk.js" ? "../../../dist/client/index.js" : "." + url));
      break;
    }
  }
}

async function genesis() {
  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);

  let vb, mb, transfer, answer;

  let issuerPrivateKey = crypto.generateKey256(),
      issuerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(issuerPrivateKey),
      buyerPrivateKey = crypto.generateKey256(),
      buyerPublicKey = crypto.secp256k1.publicKeyFromPrivateKey(buyerPrivateKey);

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();

  await vb.addTokenIssuance({
    issuerPublicKey: issuerPublicKey,
    amount: ECO.INITIAL_OFFER
  });

  vb.setGasPrice(ECO.TOKEN);
  await vb.sign();

  mb = await vb.publish();

  return {};
}

async function publishObjects(res) {
  let appOrganization = await publishApplicationOrganization(APP_PRIVATE_KEY),
      oracleOrganization = await publishOracleOrganization(ORACLE_PRIVATE_KEY);

  applicationId = await publishApplication(appOrganization);
  oracleId = await publishOracle(oracleOrganization);

  await operatorQuery(
    APP_OPERATOR_URL + "/setOrganizationId",
    { organizationId: appOrganization.id }
  );

  return {};
}

async function processDataApproval(res) {
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
      ]
    },
    permissions: {
      mainChannel: [ "senderDocument.*" ]
    },
    author: "fileSign",
    approval: {
      endorser: "sender",
      message : "fileSent"
    }
  };

  let answer = await operatorQuery(
    APP_OPERATOR_URL + "/prepareUserApproval",
    approvalObject
  );

  console.log(answer);

  return answer;
}

async function processOracleRequest(res) {
  let requestObject = {
    oracleId: oracleId,
    service: "verifyEmail",
    data: {
      publicKey: "55AA".repeat(16),
      email: "foo@bar.com"
    }
  };

  let answer = await operatorQuery(
    APP_OPERATOR_URL + "/initiateOracleRequest",
    requestObject
  );

  return {};
}

async function publishApplicationOrganization(orgPrivateKey) {
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
    countryCode: "FR",
    website: "www.carmentis.io"
  });

  await vb.addServer({
    endpoint: APP_OPERATOR_URL
  });

  vb.setGasPrice(ECO.TOKEN);
  await vb.sign();

  mb = await vb.publish();

  return {
    id: mb.hash,
    publicKey : orgPublicKey,
    privateKey: orgPrivateKey
  };
}

async function publishOracleOrganization(orgPrivateKey) {
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
    name: "Acme",
    city: "Paris",
    countryCode: "FR",
    website: "www.acme.io"
  });

  await vb.addServer({
    endpoint: ORACLE_OPERATOR_URL
  });

  vb.setGasPrice(ECO.TOKEN);
  await vb.sign();

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

  vb.setGasPrice(ECO.TOKEN);
  await vb.sign();

  mb = await vb.publish();

  return mb.hash;
}

async function publishOracle(organization) {
  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);
  blockchainCore.setUser(ROLES.OPERATOR, organization.privateKey);

  let vb, mb;

  vb = new oracleVb();

  await vb.addDeclaration({ organizationId: organization.id });
  await vb.addDescription(ORACLE.description);

  await vb.addDefinition({
    version: 1,
    definition: ORACLE.definition
  });

  vb.setGasPrice(ECO.TOKEN);
  await vb.sign();

  mb = await vb.publish();

  return mb.hash;
}

async function operatorQuery(url, data) {
  let urlObj = new URL(url);

  return new Promise(function(resolve, reject) {
    let options = {
      hostname: urlObj.hostname,
      port    : urlObj.port,
      path    : urlObj.pathname,
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
