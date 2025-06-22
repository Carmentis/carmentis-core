import { CHAIN, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { NODE_SCHEMAS } from "./constants/constants.js";
import { LevelDb } from "./levelDb.js";
import { Base64 } from "../data/base64.js";
import { RadixTree } from "../trees/radixTree.js";
import { Crypto } from "../crypto/crypto.js";
import { Utils } from "../utils/utils.js";
import { AccountManager } from "./accountManager.js";
import { Blockchain } from "../blockchain/blockchain.js";
import { MemoryProvider } from "../providers/memoryProvider.js";
import { NullNetworkProvider } from "../providers/nullNetworkProvider.js";
import { MessageSerializer, MessageUnserializer } from "../data/messageSerializer.js";
import { Provider } from "../providers/provider.js";

export class NodeCore {
  constructor(options) {
    this.db = new LevelDb(options.dbPath, NODE_SCHEMAS.DB);

    const provider = new Provider(new MemoryProvider(), new NullNetworkProvider());

    this.blockchain = new Blockchain(provider);
    this.messageUnserializer = new MessageUnserializer(SCHEMAS.NODE_MESSAGES);
    this.messageSerializer = new MessageSerializer(SCHEMAS.NODE_MESSAGES);
    this.sectionCallbacks = new Map;
    this.accountManager = new AccountManager(this.db);
    this.db.initialize();
    this.vbRadix = new RadixTree(this.db, NODE_SCHEMAS.DB_VB_RADIX);
    this.tokenRadix = new RadixTree(this.db, NODE_SCHEMAS.DB_TOKEN_RADIX);

    this.registerSectionCallbacks(
      CHAIN.ACCOUNT,
      [
        [ SECTIONS.ACCOUNT_TOKEN_ISSUANCE, this.accountTokenIssuanceCallback ],
        [ SECTIONS.ACCOUNT_TRANSFER, this.accountTokenTransferCallback ]
      ]
    );
  }

  async test() {
    await this.db.clear();
    await this.db.putObject(NODE_SCHEMAS.DB_CHAIN, "SOMEKEY", { height: 1, lastBlockTs: 1, nMicroblock: 123, objectCounters: [ 1, 2, 3, 4, 5 ] });
    console.log(await this.db.getObject(NODE_SCHEMAS.DB_CHAIN, "SOMEKEY"));

    const keys = [], values = [];
    const N = 10000;

    function randomHash() {
      return new Uint8Array([...Array(32)].map(() => Math.random() * 256 | 0));
    }

    let ts = new Date();

    for(let n = 0; n < N; n++) {
      keys[n] = randomHash();
      values[n] = randomHash();
      await this.vbRadix.set(keys[n], values[n]);
    }
    await this.vbRadix.flush();

    const rootHash = await this.vbRadix.getRootHash();
    console.log("root hash", rootHash);

    console.log("set()", new Date() - ts);
    ts = new Date();

    for(let n = 0; n < N; n++) {
      const res = await this.vbRadix.get(keys[n]);

      if(!Utils.binaryIsEqual(res.value, values[n])) {
        throw `read value is invalid`;
      }

      const proofRootHash = await RadixTree.verifyProof(keys[n], res.value, res.proof);

      if(!Utils.binaryIsEqual(proofRootHash, rootHash)) {
        throw `failed proof`;
      }
    }
    console.log("get() + verifyProof()", new Date() - ts);

    console.log("done");
  }

  registerSectionCallbacks(objectType, callbackList) {
    for(const [ sectionType, callback ] of callbackList) {
      const key = sectionType << 4 | objectType;
      this.sectionCallbacks.set(key, callback);
    }
  }

  async invokeSectionCallback(objectType, sectionType, object, apply) {
    const key = sectionType << 4 | objectType;

    if(this.sectionCallbacks.has(key)) {
      const callback = this.sectionCallbacks.get(key);
      await callback(object, apply);
    }
  }

  /**
    Incoming transaction
  */
  async checkTx(request) {
    console.log(`Received microblock`);

    const importer = this.blockchain.getMicroblockImporter(request.tx);
    const success = await this.checkMicroblock(importer);

    await importer.store(); // !!

    return new Uint8Array();
  }

  /**
    Executed by the proposer
    request.txs
  */
  async prepareProposal(request) {
  }

  /**
    Executed by all validators
    request.txs
    request.proposed_last_commit
  */
  async processProposal(request) {
  }

  async extendVote(request) {
  }

  async verifyVoteExtension(request) {
  }

  async finalizeBlock(request) {
  }

  async commit() {
    // commit changes to DB
  }

  /**
    Checks a microblock and invokes the section callbacks of the node.
  */
  async checkMicroblock(importer) {
    console.log(`Checking microblock ${Utils.binaryToHexa(importer.hash)}`);

    const status = await importer.check();

    if(status) {
      console.error(`Rejected with status ${status}: ${importer.error}`);
      return false;
    }

    for(const section of importer.vb.currentMicroblock.sections) {
      await this.invokeSectionCallback(importer.vb.type, section.type, section.object, false);
    }

    console.log(`Accepted`);
    return true;
  }

  /**
    Account callbacks
  */
  async accountTokenIssuanceCallback(object) {
    console.log("** TOKEN ISSUANCE **");
  }

  async accountTokenTransferCallback(object) {
    console.log("** TOKEN TRANSFER **");
  }

  /**
    Custom Carmentis query via abci_query
  */
  async query(data) {
    const { type, object } = this.messageUnserializer.unserialize(data);

    console.log(`Received query ${SCHEMAS.NODE_MESSAGE_NAMES[type]}`);

    switch(type) {
      case SCHEMAS.MSG_GET_VIRTUAL_BLOCKCHAIN_UPDATE: { return await this.getVirtualBlockchainUpdate(object); }
      case SCHEMAS.MSG_GET_MICROBLOCK_INFORMATION: { return await this.getMicroblockInformation(object); }
      case SCHEMAS.MSG_GET_MICROBLOCK_BODYS: { return await this.getMicroblockBodys(object); }
    }
  }

  async getVirtualBlockchainUpdate(object) {
    const stateData = await this.blockchain.provider.getVirtualBlockchainStateInternal(object.virtualBlockchainId);
    const headers = await this.blockchain.provider.getVirtualBlockchainHeaders(object.virtualBlockchainId, object.knownHeight);
    const changed = headers.length > 0;

    return this.messageSerializer.serialize(
      SCHEMAS.MSG_VIRTUAL_BLOCKCHAIN_UPDATE,
      {
        changed,
        stateData,
        headers
      }
    );
  }

  async getMicroblockInformation(object) {
    const microblockInfo = await this.blockchain.provider.getMicroblockInformation(object.hash);

    return this.messageSerializer.serialize(
      SCHEMAS.MSG_MICROBLOCK_INFORMATION,
      microblockInfo
    );
  }

  async getMicroblockBodys(object) {
    const bodys = await this.blockchain.provider.getMicroblockBodys(object.hashes);

    return this.messageSerializer.serialize(
      SCHEMAS.MSG_MICROBLOCK_BODYS,
      {
        list: bodys
      }
    );
  }

  /**
    Static helper functions
  */
  static decodeQueryField(urlObject, fieldName) {
    const hexa = urlObject.searchParams.get(fieldName);
    const data = Utils.binaryFromHexa(hexa.slice(2));
    return data;
  }

  static encodeResponse(response) {
    return JSON.stringify({
      data: Base64.encodeBinary(response)
    });
  }
}
