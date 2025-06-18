import * as http from "http";

import { SCHEMAS } from "../constants/constants.js";
import { Base64 } from "../data/base64.js";
import { Utils } from "../utils/utils.js";
import { Blockchain } from "../blockchain/blockchain.js";
import { MemoryProvider } from "../providers/memoryProvider.js";
import { NullNetworkProvider } from "../providers/nullNetworkProvider.js";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer.js";
import {Provider} from "../providers/provider.js";

const PORT = process.env.PORT || 3000;
const BLOCK_DELAY = 500;

const MESSAGES = {
  START: "Starting Carmentis node...",
  READY: `Carmentis node is ready and listening on port ${PORT}`
};

const provider = new Provider(new MemoryProvider(), new NullNetworkProvider());
const blockchain = new Blockchain(provider);

function start() {
  console.log(MESSAGES.START);

  // Start the HTTP server
  http
    .createServer(handleRequest)
    .listen(PORT, () => console.log(MESSAGES.READY));

  // Start the scheduler
  setInterval(processMempool, BLOCK_DELAY);
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
        const tx = Utils.binaryFromHexa(urlObject.searchParams.get("tx").slice(2));
        response = await checkTx(tx);
        break;
      }
      case "/abci_query": {
        const data = Utils.binaryFromHexa(urlObject.searchParams.get("data").slice(2));
        response = await query(data);
        break;
      }
    }

    res.end(
      JSON.stringify({
        data: Base64.encodeBinary(response)
      })
    );
  });
}

async function checkTx(tx) {
  console.log(`Received microblock`);

  const importer = blockchain.getMicroblockImporter(tx);
  await importer.check();
  await importer.store();

  return new Uint8Array();
}

async function query(data) {
  const unserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
  const serializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
  const { type, object } = unserializer.unserialize(data);

  console.log(`Received query of type ${type}`, object);

  switch(type) {
    case SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE: {
      const stateData = await blockchain.provider.getVirtualBlockchainStateInternal(object.virtualBlockchainId);
      const headers = await blockchain.provider.getVirtualBlockchainHeaders(object.virtualBlockchainId, object.knownHeight);
      const changed = headers.length > 0;

      return serializer.serialize(
        SCHEMAS.MSG_VIRTUAL_BLOCKCHAIN_UPDATE,
        {
          changed,
          stateData,
          headers
        }
      );
    }

    case SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION: {
      const microblockInfo = await blockchain.provider.getMicroblockInformation(object.hash);

      return serializer.serialize(
        SCHEMAS.MSG_MICROBLOCK_INFORMATION,
        microblockInfo
      );
    }

    case SCHEMAS.MSG_GET_MICROBLOCK_BODYS: {
      const bodys = await blockchain.provider.getMicroblockBodys(object.hashes);

      return serializer.serialize(
        SCHEMAS.MSG_MICROBLOCK_BODYS,
        {
          list: bodys
        }
      );
    }
  }
}

async function processMempool() {
}

start();
