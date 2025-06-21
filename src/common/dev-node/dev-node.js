import * as http from "http";
import { NodeCore } from "./node-core.js";

const PORT = process.env.PORT || 3000;
const BLOCK_DELAY = 500;

const MESSAGES = {
  START: "Starting Carmentis node...",
  READY: `Carmentis node is ready and listening on port ${PORT}`,
  CLOSED: `Server closed`
};

let server;

export function start() {
  console.log(MESSAGES.START);

  // Start the HTTP server
  server = http
    .createServer(handleRequest)
    .listen(PORT, () => console.log(MESSAGES.READY));

  // Start the scheduler
  setInterval(processMempool, BLOCK_DELAY);
}

export function stop() {
  server.close(_ => {
    console.log(MESSAGES.CLOSED);
    process.exit(0);
  });
}

function handleRequest(req, res) {
  res.setHeader("Access-Control-Allow-Origin", "*");
  res.setHeader("Access-Control-Allow-Headers", "*");
  res.setHeader("Access-Control-Allow-Methods", "OPTIONS, GET, POST");
  res.setHeader("Access-Control-Max-Age", 2592000);
  res.setHeader("Content-Type", "application/json");

  if(req.method == "OPTIONS") {
    res.end();
    return;
  }

  const body = [];

  req.on("data", (chunk) => body.push(chunk));

  req.on("end", async () => {
    const urlObject = new URL("http://localhost" + req.url);
    let response;

    switch(urlObject.pathname) {
      case "/broadcast_tx_sync": {
        const tx = NodeCore.decodeQueryField(urlObject, "tx");
        response = await NodeCore.checkTx({ tx });
        break;
      }
      case "/abci_query": {
        const data = NodeCore.decodeQueryField(urlObject, "data");
        response = await NodeCore.query(data);
        break;
      }
    }

    res.end(NodeCore.encodeResponse(response));
  });
}

async function processMempool() {
}

start();
