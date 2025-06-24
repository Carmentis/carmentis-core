import { CHAIN, SCHEMAS } from "../constants/constants";
import { SchemaUnserializer } from "../data/schemaSerializer";
import { AccountVb } from "./accountVb";
import { ValidatorNodeVb } from "./validatorNodeVb";
import { OrganizationVb } from "./organizationVb";
import { ApplicationVb } from "./applicationVb";
import { ApplicationLedgerVb } from "./applicationLedgerVb";
import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";

const VB_CLASSES = [
  AccountVb,
  ValidatorNodeVb,
  OrganizationVb,
  ApplicationVb,
  ApplicationLedgerVb
];

export class MicroblockImporter {
  bodyData: any;
  currentTimestamp: any;
  error: any;
  hash: any;
  header: any;
  headerData: any;
  provider: any;
  vb: any;
  constructor({
    data,
    provider
  }: any) {
    this.provider = provider;
    this.headerData = data.slice(0, SCHEMAS.MICROBLOCK_HEADER_SIZE);
    this.bodyData = data.slice(SCHEMAS.MICROBLOCK_HEADER_SIZE);
    this.hash = Crypto.Hashes.sha256AsBinary(this.headerData);
    this.error = "";
  }

  async check(currentTimestamp: any) {
    this.currentTimestamp = currentTimestamp || Utils.getTimestampInSeconds();

    return (await this.checkHeader()) || (await this.checkTimestamp()) || (await this.checkContent());
  }

  /**
    Checks the consistency of the serialized header, the magic string and the protocol version.
  */
  async checkHeader() {
    try {
      const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
      this.header = headerUnserializer.unserialize(this.headerData);

      if(this.header.magicString != CHAIN.MAGIC_STRING) {
        this.error = `magic string '${CHAIN.MAGIC_STRING}' is missing`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR
      }
      if(this.header.protocolVersion != CHAIN.PROTOCOL_VERSION) {
        this.error = `invalid protocol version (expected ${CHAIN.PROTOCOL_VERSION}, got ${this.header.protocolVersion})`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR
      }
    }
    catch(error) {
      this.error = `invalid header format (${error})`;
      return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
    }
    return 0;
  }

  /**
    Checks the timestamp declared in the header.
  */
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

  /**
    Checks the body hash declared in the header, the existence of the previous microblock (if any) and the microblock height.
    Then instantiates a virtual blockchain of the relevant type and attempts to import the microblock (which includes the
    state update). Finally, verifies that the declared gas matches the computed gas.
  */
  async checkContent() {
    try {
      // check the body hash
      const bodyHash = Crypto.Hashes.sha256AsBinary(this.bodyData);

      if(!Utils.binaryIsEqual(bodyHash, this.header.bodyHash)) {
        this.error = `inconsistent body hash`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
      }

      // check the previous microblock, or get the type from the leading byte of the previousHash field if genesis
      let type;
      let vbIdentifier;

      if(this.header.height > 1) {
        const previousMicroblockInfo = await this.provider.getMicroblockInformation(this.header.previousHash);

        if(!previousMicroblockInfo) {
          this.error = `previous microblock ${Utils.binaryToHexa(this.header.previousHash)} not found`;
          return CHAIN.MB_STATUS_PREVIOUS_HASH_ERROR;
        }

        const headerUnserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER);
        const previousHeader = headerUnserializer.unserialize(previousMicroblockInfo.header);

        // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
        if(this.header.height != previousHeader.height + 1) {
          // @ts-expect-error TS(2339): Property 'height' does not exist on type '{}'.
          this.error = `inconsistent microblock height (expected ${previousHeader.height + 1}, got ${this.header.height})`;
          return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
        }

        type = previousMicroblockInfo.virtualBlockchainType;
        vbIdentifier = previousMicroblockInfo.virtualBlockchainId;
      }
      else {
        type = this.header.previousHash[0];
      }

      // attempt to instantiate the VB class
      const vbClass = VB_CLASSES[type];

      if(!vbClass) {
        this.error = `invalid virtual blockchain type ${type}`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
      }

      this.vb = new vbClass({ provider: this.provider });

      // load the VB if this is an existing one
      if(this.header.height > 1) {
        await this.vb.load(vbIdentifier);
      }

      // attempt to import the microblock
      await this.vb.importMicroblock(this.headerData, this.bodyData);

      // check the gas
      const declaredGas = this.vb.currentMicroblock.header.gas;
      const expectedGas = this.vb.currentMicroblock.computeGas();

      if(declaredGas != expectedGas) {
        this.error = `inconsistent gas value in microblock header (expected ${expectedGas}, got ${declaredGas})`;
        return CHAIN.MB_STATUS_UNRECOVERABLE_ERROR;
      }
    }
    catch(error) {
      // @ts-expect-error TS(2571): Object is of type 'unknown'.
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
