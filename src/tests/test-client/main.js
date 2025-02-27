const NODE_URL = "http://localhost:3000";
const APP_OPERATOR_URL = "http://localhost:3005";

const { ECO, SCHEMAS } = Carmentis.constants;

const db = {
  [ SCHEMAS.DB_MICROBLOCK_INFO ]: new Map(),
  [ SCHEMAS.DB_MICROBLOCK_DATA ]: new Map(),
  [ SCHEMAS.DB_VB_INFO         ]: new Map()
};

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
} = Carmentis.blockchain;

blockchainCore.setNode(NODE_URL);

let wiClient;

addEventListener("DOMContentLoaded", initialize);

function initialize() {
  wiClient = new Carmentis.wiClient;

  wiClient.attachQrCodeContainer("output");
  wiClient.attachExtensionButton("openExtension");
  wiClient.setServerUrl(APP_OPERATOR_URL);

  document.querySelectorAll(".genesisRequired, .publicationRequired").forEach(el =>
    el.setAttribute("disabled", "")
  );
}

async function genesis() {
  await postQuery("genesis");

  document.querySelectorAll(".genesisRequired").forEach(el =>
    el.removeAttribute("disabled")
  );
}

async function publishObjects() {
  await postQuery("publishObjects");

  document.querySelectorAll(".publicationRequired").forEach(el =>
    el.removeAttribute("disabled")
  );
}

async function authentication() {
  let answer = await wiClient.authenticationByPublicKey("FFAA7FC3FA1D8D74546427AD2C28BBBF127B6072344E494FF8D5E575B6BC3D0E");

  console.log("resolved authenticationByPublicKey promise", answer);
}

async function oracleRequest() {
  await postQuery("oracleRequest");
}

async function dataApproval() {
  let answer = await postQuery("dataApproval"),
      dataId = answer.data.dataId;

  console.log(answer);

  answer = await wiClient.getApprovalData(dataId);

  console.log("resolved getApprovalData promise", answer);
}

async function scanQRCode() {
  let qrData = wiClient.getQrData("output"),
      iframe = document.getElementById("appWalletIframe").contentWindow;

  iframe.postMessage({ carmentisMessage: true, qrData: qrData }, "*");
}

async function postQuery(method, object = {}) {
  const response = await fetch(
    "http://localhost:8080/" + method,
    {
      method: "POST",
      body: JSON.stringify(object),
      headers: {
        "Content-type": "application/json; charset=UTF-8"
      }
    }
  );

  return await response.json();
}
