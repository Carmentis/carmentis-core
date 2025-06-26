import {SCHEMAS, SECTIONS} from "../constants/constants";
import {ApplicationLedgerVb} from "./applicationLedgerVb";
import {SchemaValidator} from "../data/schemaValidator";
import {Crypto} from "../crypto/crypto";
import {Utils} from "../utils/utils";
import {RecordDescription} from "./blockchain";
import {Provider} from "../providers/provider";
import {Hash} from "./types";
import {Section} from "./microblock";

export class ApplicationLedger {
  provider: any;
  signatureAlgorithmId: any;
  vb: ApplicationLedgerVb;
  gasPrice: number;

  constructor({
    provider
  }: {provider: Provider}) {
    this.vb = new ApplicationLedgerVb({ provider });
    //this.publicKey = publicKey;
    //this.privateKey = privateKey;
    this.provider = provider
    this.gasPrice = 0;
    //this.signatureAlgorithmId = Crypto.SECP256K1;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create(applicationId: string) {
    if (!this.provider.isKeyed()) throw 'Cannot create an application ledger without a keyed provider.'
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });
  }

  async _load(identifier: Uint8Array) {
    await this.vb.load(identifier);
  }

  async _processJson(object: RecordDescription) {
    const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
    validator.validate(object);

    // if there's a reference to an existing VB, load it
    if(object.virtualBlockchainId) {
      await this.vb.load(Utils.binaryFromHexa(object.virtualBlockchainId));
    }

    if(this.vb.height == 0) {
      // genesis -> declare the signature algorithm and the application
      await this.vb.setSignatureAlgorithm({
        algorithmId: this.signatureAlgorithmId
      });
      await this.vb.addDeclaration({
        applicationId: Utils.binaryFromHexa(object.applicationId)
      });
    }

    // add the new actors
    for(const def of object.actors || []) {
      await this.vb.createActor({
        id: this.vb.getNumberOfActors(),
        type: 0,
        name: def.name
      });
    }

    // get the author ID
    const authorId = this.vb.getActorId(object.author);

    // get the endorser ID
    const endorserId = object.endorser && this.vb.getActorId(object.endorser);

    // add the new channels
    for(const def of object.channels || []) {
      await this.vb.createChannel({
        id:  this.vb.getNumberOfChannels(),// this.vb.state.channels.length,
        isPrivate: !def.public,
        creatorId: authorId,
        name: def.name
      });
    }

    // initialize an IR object, set the channels and load the data
    const ir = this.vb.getIntermediateRepresentationInstance();

    ir.buildFromJson(object.data);

    // process field assignations
    for(const def of object.channelAssignations || []) {
      const channelId = this.vb.getChannelId(def.channelName);
      ir.setChannel(def.fieldPath, channelId);
    }

    // process actor assignations
    for(const def of object.actorAssignations || []) {
      const channelId = this.vb.getChannelId(def.channelName);
      const actorId = this.vb.getActorId(def.actorName);
    }

    // process hashable fields
    for(const def of object.hashableFields || []) {
      ir.setAsHashable(def.fieldPath);
    }

    // process maskable fields
    for(const def of object.maskableFields || []) {
      const list = def.maskedParts.map((obj: any) => [ obj.position, obj.position + obj.length, obj.replacementString ]);
      ir.setAsMaskable(def.fieldPath, list);
    }

    // process channel data
    ir.serializeFields();
    ir.populateChannels();

    const channelDataList = ir.exportToSectionFormat();

    for(const channelData of channelDataList) {
      if(channelData.isPrivate) {
        const channelKey = new Uint8Array(32); // FIXME
        const iv = new Uint8Array(32);         //
        const encryptedData = Crypto.Aes.encryptGcm(channelKey, channelData.data, iv);

        await this.vb.addPrivateChannelData({
          channelId: channelData.channelId,
          // @ts-expect-error TS(2339): Property 'merkleRootHash' does not exist on type '... Remove this comment to see the full error message
          merkleRootHash: Utils.binaryFromHexa(channelData.merkleRootHash),
          encryptedData: encryptedData
        });
      }
      else {
        await this.vb.addPublicChannelData({
          channelId: channelData.channelId,
          data: channelData.data
        });
      }
    }
    console.log(this.vb);
  }

  async getRecord(height: number) {
    const ir = await this.getMicroblockIntermediateRepresentation(height);
    return ir.exportToJson();
  }

  /**
   * Exports a proof containing intermediate representations for all microblocks up to the current height of the virtual blockchain.
   *
   * @param {Object} customInfo - Custom information to include in the proof.
   * @param {string} customInfo.author - The author of the proof file.
   * @return {Promise<Object>} A promise that resolves to an object containing metadata and the exported proof data.
   * @return {Object} return.info - Metadata about the proof.
   * @return {string} return.info.title - A title describing the proof file.
   * @return {string} return.info.date - The date the proof was created, in ISO format.
   * @return {string} return.info.author - The author of the proof file.
   * @return {string} return.info.virtualBlockchainIdentifier - The identifier of the virtual blockchain.
   * @return {Array<Object>} return.proofs - An array of exported proof data for each microblock.
   * @return {number} return.proofs[].height - The height of the microblock.
   * @return {Object} return.proofs[].data - The proof data for the corresponding microblock.
   */
  async exportProof(customInfo: { author: string }) {
    const proofs = [];

    for(let height = 1; height <= this.vb.height; height++) {
      const ir = await this.getMicroblockIntermediateRepresentation(height);

      proofs.push({
        height: height,
        data: ir.exportToProof()
      });
    }

    const info = {
      title: "Carmentis proof file - Visit www.carmentis.io for more information",
      date: new Date().toJSON(),
      author: customInfo.author,
      virtualBlockchainIdentifier: Utils.binaryToHexa(this.vb.identifier)
    };

    return {
      info,
      proofs
    };
  }

  async importProof(proofObject: any) {
    const data = [];

    for(let height = 1; height <= this.vb.height; height++) {
      const proof = proofObject.proofs.find((proof: any) => proof.height == height);
      const ir = await this.getMicroblockIntermediateRepresentation(height);
      const merkleData = ir.importFromProof(proof.data);

      // TODO: check Merkle root hash

      data.push({
        height,
        data: ir.exportToJson()
      });
    }
    return data;
  }

  async getMicroblockIntermediateRepresentation(height: number) {
    const microblock = await this.vb.getMicroblock(height);
    const publicChannelDataSections = microblock.getSections((section: any) => section.type == SECTIONS.APP_LEDGER_PUBLIC_CHANNEL_DATA);
    const privateChannelDataSections = microblock.getSections((section: any) => section.type == SECTIONS.APP_LEDGER_PRIVATE_CHANNEL_DATA);
    const ir = this.vb.getIntermediateRepresentationInstance();

    // @ts-expect-error TS(2339): Property 'merkleRootHash' does not exist on type '... Remove this comment to see the full error message'
    const list: { channelId: number, data: object, merkleRootHash?: string } = [
      ...publicChannelDataSections.map((section: Section<{channelId: number, data: object}>) => {
        return {
          channelId: section.object.channelId,
          data: section.object.data
        };
      }),
      ...privateChannelDataSections.map((section: Section<{channelId: number, data: object, merkleRootHash: Uint8Array, encryptedData: string}>) => {
        const channelKey = new Uint8Array(32);  // FIXME
        const iv = new Uint8Array(32);          //
        const data = Crypto.Aes.decryptGcm(channelKey, section.object.encryptedData, iv);
        return {
          channelId: section.object.channelId,
          merkleRootHash: Utils.binaryToHexa(section.object.merkleRootHash),
          data: data as Uint8Array
        };
      })
    ];

    ir.importFromSectionFormat(list);
    return ir;
  }

  setGasPrice(gasPrice: number) {
    this.gasPrice = gasPrice;
  }

  getMicroblockData() {
    return this.vb.getMicroblockData();
  }

  /**
   * Retrieves the application ID.
   *
   * @return {Hash} The hashed application ID obtained from the underlying system.
   */
  getApplicationId() {
    return Hash.from(this.vb.getApplicationId());
  }

  getHeight(): number {
    return this.vb.height;
  }

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    this.vb.setGasPrice(this.gasPrice);
    await this.vb.signAsAuthor(privateKey);
    return await this.vb.publish();
  }
}
