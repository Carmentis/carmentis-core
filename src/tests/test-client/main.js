const NODE_URL = "http://127.0.0.1:3000";
const { ECO, SCHEMAS } = Carmentis.constants;

const db = {
  [ SCHEMAS.DB_MICROBLOCK_INFO ]: new Map(),
  [ SCHEMAS.DB_MICROBLOCK_DATA ]: new Map(),
  [ SCHEMAS.DB_VB_INFO         ]: new Map(),
  [ SCHEMAS.DB_BLOCK           ]: new Map()
};

const memoryDb = {
  async put(tableId, key, value) {
    db[tableId].set(key, value);
    return true;
  },
  async get(tableId, key) {
    return db[tableId].get(key);
  }
};

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
} = Carmentis.blockchain;

let wiClient;

async function tokenIssuance() {
  blockchainCore.setDbInterface(memoryDb);
  blockchainCore.setNode(NODE_URL);

  let vb, mb, transfer, answer;

  let issuerPrivateKey = Carmentis.crypto.generateKey256(),
      issuerPublicKey = Carmentis.crypto.secp256k1.publicKeyFromPrivateKey(issuerPrivateKey),
      buyerPrivateKey = Carmentis.crypto.generateKey256(),
      buyerPublicKey = Carmentis.crypto.secp256k1.publicKeyFromPrivateKey(buyerPrivateKey);

  blockchainCore.setUser(ROLES.USER, issuerPrivateKey);

  vb = new accountVb();

  await vb.addTokenIssuance({
    issuerPublicKey: issuerPublicKey,
    amount: ECO.INITIAL_OFFER
  });

  await vb.sign();

  vb.setGasPrice(ECO.TOKEN);
  mb = await vb.publish();
}

async function authentication() {
  wiClient = new Carmentis.wiClient;

  wiClient.attachQrCodeContainer("output");
  wiClient.attachExtensionButton("openExtension");
  wiClient.setServerUrl("http://localhost:3005");

  let answer = await wiClient.authenticationByPublicKey("FFAA7FC3FA1D8D74546427AD2C28BBBF127B6072344E494FF8D5E575B6BC3D0E");

  console.log("resolved authenticationByPublicKey promise", answer);
}

async function scanQRCode() {
  let qrData = wiClient.getQrData("output"),
      iframe = document.getElementById("appWalletIframe").contentWindow;

  iframe.postMessage({ carmentisMessage: true, qrData: qrData }, "*");
}

async function dataApproval() {
  const response = await fetch(
    "http://localhost:8080/dataApproval",
    {
      method: "POST",
      body: JSON.stringify({}),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }
  );

  const data = await response.json();

  console.log(data);
}
