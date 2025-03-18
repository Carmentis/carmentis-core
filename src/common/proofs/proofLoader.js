import { ID, DATA, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { proofDecoder } from "./field-merklizer.js";
import * as base64 from "../util/base64.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";
import * as sectionSerializer from "../serializers/section-serializer.js";
import { appLedgerVb } from "../blockchain/blockchain.js";

export class proofLoader {
  constructor(proof) {
    this.proof = JSON.parse(proof);
  }

  async load() {
    const vb = new appLedgerVb(this.proof.proofData.appLedgerId);
    const records = [];

    await vb.load();

    for(let mbObject of this.proof.proofData.microblocks) {
      const appDef = await vb.loadApplicationDefinition(mbObject.appVersion);
      const mb = vb.microblocks[mbObject.height - 1];
      const serialized = base64.decodeBinary(mbObject.data, base64.BASE64);
      const proofList = schemaSerializer.decode(SCHEMAS.PROOF_LIST, serialized).list;
      const sectionIndex = mb.sections.findIndex(section => section.id == SECTIONS.APP_LEDGER_CHANNEL_DATA);
      const serializedSection = mb.object.body.sections[sectionIndex];
      const sectionObject = schemaSerializer.decode(SCHEMAS.SECTION, serializedSection);

      const decodedProofList = proofList.map(proofData => {
        let decoder = new proofDecoder(proofData);

        return decoder.decode();
      });

      const record = sectionSerializer.decodeFromProof(ID.OBJ_APP_LEDGER, sectionObject, decodedProofList, appDef.definition);

      records.push({
        height: mbObject.height,
        record: record.object
      });
    }

    return records;
  }
}
