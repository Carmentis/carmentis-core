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
    this.data = data;
  }

  async check() {
    this.headerData = this.data.slice(0, SCHEMAS.MICROBLOCK_HEADER_SIZE);
    this.bodyData = this.data.slice(SCHEMAS.MICROBLOCK_HEADER_SIZE);

    const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
    const header = headerUnserializer.unserialize(this.headerData);

    const bodyHash = Crypto.Hashes.sha256AsBinary(this.bodyData);

    if(!Utils.binaryIsEqual(bodyHash, header.bodyHash)) {
      throw `inconsistent body hash`;
    }

    this.height = header.height;

    let vbIdentifier;

    if(this.height > 1) {
      const previousMicroblockInfo = await this.provider.getMicroblockInformation(header.previousHash);

      if(!previousMicroblockInfo) {
        throw `previous microblock not found`;
      }
      this.type = previousMicroblockInfo.virtualBlockchainType;
      vbIdentifier = previousMicroblockInfo.virtualBlockchainId;
    }
    else {
      this.type = header.previousHash[0];
    }

    switch(this.type) {
      case CHAIN.VB_ACCOUNT     : { this.vb = new AccountVb({ provider: this.provider }); break; }
      case CHAIN.VB_ORGANIZATION: { this.vb = new OrganizationVb({ provider: this.provider }); break; }
      case CHAIN.VB_APPLICATION : { this.vb = new ApplicationVb({ provider: this.provider }); break; }
      case CHAIN.VB_APP_LEDGER  : { this.vb = new ApplicationLedgerVb({ provider: this.provider }); break; }

      default: {
        throw `inconsistent type`;
      }
    }

    if(this.height > 1) {
console.log("loading from identifier", vbIdentifier);
      await this.vb.load(vbIdentifier);
    }

    this.hash = await this.vb.importMicroblock(this.headerData, this.bodyData);
  }

  async store() {
    await this.provider.storeMicroblock(this.hash, this.vb.identifier, this.type, this.height, this.headerData, this.bodyData);
    await this.provider.updateVirtualBlockchainState(this.vb.identifier, this.type, this.height, this.hash, this.vb.state);
  }
}
