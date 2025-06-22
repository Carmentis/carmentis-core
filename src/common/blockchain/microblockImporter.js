import { CHAIN, SCHEMAS } from "../constants/constants.js";
import { SchemaUnserializer } from "../data/schemaSerializer.js";
import { AccountVb } from "./accountVb.js";
import { OrganizationVb } from "./organizationVb.js";
import { ApplicationVb } from "./applicationVb.js";
import { ApplicationLedgerVb } from "./applicationLedgerVb.js";
import { Crypto } from "../crypto/crypto.js";
import { Utils } from "../utils/utils.js";

export class MicroblockImporter {
  constructor({ data, provider }) {
    this.provider = provider;
    this.headerData = data.slice(0, SCHEMAS.MICROBLOCK_HEADER_SIZE);
    this.bodyData = data.slice(SCHEMAS.MICROBLOCK_HEADER_SIZE);
    this.hash = Crypto.Hashes.sha256AsBinary(this.headerData);
    this.error = "";
  }

  async check(currentTimestamp) {
    this.currentTimestamp = currentTimestamp || Utils.getTimestampInSeconds();

    return await this.checkHeader() || await this.checkTimestamp() || await this.checkContent();
  }

  async checkHeader() {
    try {
      const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
      this.header = headerUnserializer.unserialize(this.headerData);

      if(this.header.magicString != CHAIN.MAGIC_STRING) {
        this.error = `magic string '${CHAIN.MAGIC_STRING}' is missing`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR
      }
    }
    catch(error) {
      this.error = `invalid header format (${error})`;
      return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
    }
    return 0;
  }

  async checkTimestamp() {
    if(this.header.timestamp < this.currentTimestamp - CHAIN.MAX_MICROBLOCK_PAST_DELAY) {
      this.error = `timestamp is too far in the past`;
      return CHAIN.MB_STATUS_TIMESTAMP_ERROR;
    }
    if(this.header.timestamp > this.currentTimestamp + CHAIN.MAX_MICROBLOCK_FUTURE_DELAY) {
      this.error = `timestamp is too far in the future`;
      return CHAIN.MB_STATUS_TIMESTAMP_ERROR;
    }
    return 0;
  }

  async checkContent() {
    try {
      const bodyHash = Crypto.Hashes.sha256AsBinary(this.bodyData);

      if(!Utils.binaryIsEqual(bodyHash, this.header.bodyHash)) {
        this.error = `inconsistent body hash`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
      }

      let type;
      let vbIdentifier;

      if(this.header.height > 1) {
        const previousMicroblockInfo = await this.provider.getMicroblockInformation(this.header.previousHash);

        if(!previousMicroblockInfo) {
          this.error = `previous microblock ${Utils.binaryToHexa(this.header.previousHash)} not found`;
          return CHAIN.MB_STATUS_PREVIOUS_HASH_ERROR;
        }
        // TODO: test the height of the previous microblock
        type = previousMicroblockInfo.virtualBlockchainType;
        vbIdentifier = previousMicroblockInfo.virtualBlockchainId;
      }
      else {
        type = this.header.previousHash[0];
      }

      switch(type) {
        case CHAIN.VB_ACCOUNT     : { this.vb = new AccountVb({ provider: this.provider }); break; }
        case CHAIN.VB_ORGANIZATION: { this.vb = new OrganizationVb({ provider: this.provider }); break; }
        case CHAIN.VB_APPLICATION : { this.vb = new ApplicationVb({ provider: this.provider }); break; }
        case CHAIN.VB_APP_LEDGER  : { this.vb = new ApplicationLedgerVb({ provider: this.provider }); break; }

        default: {
          this.error = `inconsistent virtual blockchain type ${type}`;
          return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }
      }

      if(this.header.height > 1) {
        await this.vb.load(vbIdentifier);
      }

      await this.vb.importMicroblock(this.headerData, this.bodyData);
    }
    catch(error) {
      this.error = error.toString();
      return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
    }
    return 0;
  }

  async store() {
    await this.provider.storeMicroblock(this.hash, this.vb.identifier, this.vb.type, this.vb.height, this.headerData, this.bodyData);
    await this.provider.updateVirtualBlockchainState(this.vb.identifier, this.vb.type, this.vb.height, this.hash, this.vb.state);
  }
}
