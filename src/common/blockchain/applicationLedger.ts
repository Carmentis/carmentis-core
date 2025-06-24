import { SCHEMAS } from "../constants/constants";
import { ApplicationLedgerVb } from "./applicationLedgerVb";
import { SchemaValidator } from "../data/schemaValidator";
import { IntermediateRepresentation } from "../records/intermediateRepresentation";
import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";

export class ApplicationLedger {
  provider: any;
  signatureAlgorithmId: any;
  vb: any;
  constructor({
    provider
  }: any) {
    this.vb = new ApplicationLedgerVb({ provider });
    //this.publicKey = publicKey;
    //this.privateKey = privateKey;
    this.provider = provider
    //this.signatureAlgorithmId = Crypto.SECP256K1;
    if (this.provider.isKeyed()) {
      const privateKey = this.provider.getPrivateSignatureKey();
      this.signatureAlgorithmId = privateKey.getSignatureAlgorithmId();
    }
  }

  async _create(applicationId: any) {
    if (!this.provider.isKeyed()) throw 'Cannot create an application ledger without keyed provider.'
    await this.vb.setSignatureAlgorithm({
      algorithmId: this.signatureAlgorithmId
    });
  }

  async _load(identifier: any) {
    await this.vb.load(identifier);
  }

  async _processJson(object: any) {
    const validator = new SchemaValidator(SCHEMAS.RECORD_DESCRIPTION);
    validator.validate(object);

    // if there's a reference to an existing VB, load it
    if(object.virtualBlockchainId) {
      await this.vb.load(object.virtualBlockchainId);
    }
    else {
      await this.vb.setSignatureAlgorithm({
        algorithmId: this.signatureAlgorithmId
      });
    }

    // add the new actors
    for(const def of object.actors || []) {
      await this.vb.createActor({
        id: this.vb.state.actors.length,
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
        id: this.vb.state.channels.length,
        isPrivate: !def.isPublic,
        keyOwnerId: authorId,
        name: def.name
      });
    }

    // initialize an IR object, load the data and set the channels
    const ir = new IntermediateRepresentation;
    ir.buildFromJson(object.data);

    for(let channelId = 0; channelId < this.vb.state.channels.length; channelId++) {
      const channel = this.vb.state.channels[channelId];

      if(channel.isPrivate) {
        ir.addPrivateChannel(channelId);
      }
      else {
        ir.addPublicChannel(channelId);
      }
    }

    // process field assignations
    for(const def of object.fieldAssignations || []) {
      const channelId = this.vb.getChannelId(def.channelName);
      ir.setChannel(def.fieldPath, channelId);
    }

    // process actor assignations
    for(const def of object.actorAssignations || []) {
      const channelId = this.vb.getChannelId(def.channelName),
            actorId = this.vb.getActorId(def.actorName);
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
        const channelKey = new Uint8Array(32), // !!
              iv = new Uint8Array(32), // !!
              encryptedData = Crypto.Aes.encryptGcm(channelKey, channelData.data, iv);

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

  async publishUpdates() {
    if (!this.provider.isKeyed()) throw 'Cannot publish updates without keyed provider.'
    const privateKey = this.provider.getPrivateSignatureKey();
    await this.vb.signAsAuthor(privateKey);
    return await this.vb.publish();
  }
}
