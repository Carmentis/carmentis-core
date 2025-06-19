import { CHAIN, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { NODE_SCHEMAS } from "./node-constants.js";
import { LevelDb } from "./levelDb.js";
import { Base64 } from "../data/base64.js";
import { Utils } from "../utils/utils.js";
import { Blockchain } from "../blockchain/blockchain.js";
import { MemoryProvider } from "../providers/memoryProvider.js";
import { NullNetworkProvider } from "../providers/nullNetworkProvider.js";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer.js";
import {Provider} from "../providers/provider.js";

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
db.open();

registerSectionCallbacks(
  CHAIN.ACCOUNT,
  [
    [ SECTIONS.ACCOUNT_TOKEN_ISSUANCE, accountTokenIssuanceCallback ]
  ]
);

function registerSectionCallbacks(objectType, callbackList) {
  for(const [ sectionType, callback ] of callbackList) {
    const key = sectionType << 4 | objectType;
    callbacks.set(key, callback);
  }
}

async function invokeSectionCallback(objectType, sectionType, object) {
  const key = sectionType << 4 | objectType;

  if(callbacks.has(key)) {
    const callback = callbacks.get(key);
    await callback(object);
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

async function checkTx(tx) {
  console.log(`Received microblock`);

  const importer = blockchain.getMicroblockImporter(tx);
  await importer.check();

  for(const section of importer.vb.currentMicroblock.sections) {
    await invokeSectionCallback(importer.vb.type, section.type, section.object);
  }
  
  await importer.store();

  return new Uint8Array();
}

async function accountTokenIssuanceCallback(object) {
  console.log("** TOKEN ISSUANCE **");
}

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
