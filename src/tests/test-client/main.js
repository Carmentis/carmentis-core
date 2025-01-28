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

async function authentication() {
  wiClient = new Carmentis.wiClient;

  wiClient.attachQrCodeContainer("output");
  wiClient.setServerUrl("http://localhost:3005");
  wiClient.authenticationByPublicKey();
}

async function scanQRCode() {
  let qrData = wiClient.getQrData("output"),
      iframe = document.getElementById("walletIframe").contentWindow;

  iframe.postMessage({ carmentisMessage: true, qrData: qrData }, "*");
}

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
