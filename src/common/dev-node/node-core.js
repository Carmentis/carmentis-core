import { CHAIN, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { NODE_SCHEMAS } from "./constants/constants.js";
import { LevelDb } from "./levelDb.js";
import { Base64 } from "../data/base64.js";
import { RadixTree } from "../trees/radixTree.js";
import { Utils } from "../utils/utils.js";
import { AccountManager } from "./accountManager.js";
import { Blockchain } from "../blockchain/blockchain.js";
import { MemoryProvider } from "../providers/memoryProvider.js";
import { NullNetworkProvider } from "../providers/nullNetworkProvider.js";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer.js";
import { Provider } from "../providers/provider.js";

export const NodeCore = {
  decodeQueryField,
  encodeResponse,
  checkTx,
  query
};

const messageUnserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
const messageSerializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);

const provider = new Provider(new MemoryProvider(), new NullNetworkProvider());
const blockchain = new Blockchain(provider);

const callbacks = new Map;

const db = new LevelDb("database", NODE_SCHEMAS.DB);
db.initialize();
const vbRadix = new RadixTree(db, NODE_SCHEMAS.DB_VB_RADIX);
const tokenRadix = new RadixTree(db, NODE_SCHEMAS.DB_TOKEN_RADIX);
const accountManager = new AccountManager(db);

test();

async function test() {
  await db.clear();
  await db.putObject(NODE_SCHEMAS.DB_CHAIN, "SOMEKEY", { height: 1, lastBlockTs: 1, nMicroblock: 123, objectCounters: [ 1, 2, 3, 4, 5 ] });
  console.log(await db.getObject(NODE_SCHEMAS.DB_CHAIN, "SOMEKEY"));

  const keys = [], values = [];
  const N = 10000;

  function randomHash() {
    return new Uint8Array([...Array(32)].map(() => Math.random() * 256 | 0));
  }

  for(let n = 0; n < N; n++) {
    keys[n] = randomHash();
    values[n] = randomHash();
    await vbRadix.set(keys[n], values[n]);
  }
  await vbRadix.flush();

  const rootHash = await vbRadix.getRootHash();
  console.log("root hash", rootHash);

  for(let n = 0; n < N; n++) {
    const res = await vbRadix.get(keys[n]);

    if(!Utils.binaryIsEqual(res.value, values[n])) {
      throw `read value is invalid`;
    }

    const proofRootHash = await RadixTree.verifyProof(keys[n], res.value, res.proof);

    if(!Utils.binaryIsEqual(proofRootHash, rootHash)) {
      throw `failed proof`;
    }
  }
  console.log("done");
}

registerSectionCallbacks(
  CHAIN.ACCOUNT,
  [
    [ SECTIONS.ACCOUNT_TOKEN_ISSUANCE, accountTokenIssuanceCallback ],
    [ SECTIONS.ACCOUNT_TOKEN_TRANSFER, accountTokenTransferCallback ]
  ]
);

function registerSectionCallbacks(objectType, callbackList) {
  for(const [ sectionType, callback ] of callbackList) {
    const key = sectionType << 4 | objectType;
    callbacks.set(key, callback);
  }
}

async function invokeSectionCallback(objectType, sectionType, object, apply) {
  const key = sectionType << 4 | objectType;

  if(callbacks.has(key)) {
    const callback = callbacks.get(key);
    await callback(object, apply);
  }
}

function decodeQueryField(urlObject, fieldName) {
  const hexa = urlObject.searchParams.get(fieldName);
  const data = Utils.binaryFromHexa(hexa.slice(2));
  return data;
}

function encodeResponse(response) {
  return JSON.stringify({
    data: Base64.encodeBinary(response)
  });
}

/**
  Incoming transaction
*/
async function checkTx(request) {
  console.log(`Received microblock`);

  const importer = blockchain.getMicroblockImporter(request.tx);
  await importer.check();

  for(const section of importer.vb.currentMicroblock.sections) {
    await invokeSectionCallback(importer.vb.type, section.type, section.object, false);
  }

  await importer.store();

  return new Uint8Array();
}

/**
  Executed by the proposer
  request.txs
*/
async function prepareProposal(request) {
}

/**
  Executed by all validators
  request.txs
  request.proposed_last_commit
*/
async function processProposal(request) {
}

async function extendVote(request) {
}

async function verifyVoteExtension(request) {
}

async function finalizeBlock(request) {
}

async function commit() {
  // commit changes to DB
}

/**
  Account callbacks
*/
async function accountTokenIssuanceCallback(object, apply) {
  console.log("** TOKEN ISSUANCE **");
}

async function accountTokenTransferCallback(object, apply) {
  console.log("** TOKEN TRANSFER **");
}

/**
  Custom Carmentis query via abci_query
*/
async function query(data) {
  const { type, object } = messageUnserializer.unserialize(data);

  console.log(`Received query of type ${type}`, object);

  switch(type) {
    case SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE: { return getVirtualBlockchainUpdate(object); }
    case SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION: { return getMicroblockInformation(object); }
    case SCHEMAS.MSG_GET_MICROBLOCK_BODYS: { return getMicroblockBodys(object); }
  }
}

async function getVirtualBlockchainUpdate(object) {
  const stateData = await blockchain.provider.getVirtualBlockchainStateInternal(object.virtualBlockchainId);
  const headers = await blockchain.provider.getVirtualBlockchainHeaders(object.virtualBlockchainId, object.knownHeight);
  const changed = headers.length > 0;

  return messageSerializer.serialize(
    SCHEMAS.MSG_VIRTUAL_BLOCKCHAIN_UPDATE,
    {
      changed,
      stateData,
      headers
    }
  );
}

async function getMicroblockInformation(object) {
  const microblockInfo = await blockchain.provider.getMicroblockInformation(object.hash);

  return messageSerializer.serialize(
    SCHEMAS.MSG_MICROBLOCK_INFORMATION,
    microblockInfo
  );
}

async function getMicroblockBodys(object) {
  const bodys = await blockchain.provider.getMicroblockBodys(object.hashes);

  return messageSerializer.serialize(
    SCHEMAS.MSG_MICROBLOCK_BODYS,
    {
      list: bodys
    }
  );
}
