import { ID, DATA, SCHEMAS, SECTIONS } from "../constants/constants.js";
import { proofGenerator } from "./field-merklizer.js";
import * as base64 from "../util/base64.js";
import * as schemaSerializer from "../serializers/schema-serializer.js";

export class proofBuilder {
  constructor(vb) {
    if(vb.type != ID.OBJ_APP_LEDGER) {
      throw "A proof may only be built from an application ledger";
    }

    console.log(vb);

    this.vb = vb;
    this.issuer = "(not specified)";
    this.microblocks = [];
  }

  setIssuer(name) {
    this.issuer = name;
  }

  addAllMicroblocks() {
    for(let n = 0; n < this.vb.microblocks.length; n++) {
      this.addMicroblock(n);
    }
  }

  addMicroblock(n) {
    if(!this.microblocks.includes(n)) {
      this.microblocks.push(n);
    }
  }

  generate() {
    const date = new Date();
    const applicationName = "";
    const operatorName = "";

    const microblocks = this.microblocks.map(n => {
      const mb = this.vb.microblocks[n];
      const section = mb.sections.find(section => section.id == SECTIONS.APP_LEDGER_CHANNEL_DATA);

      if(!section) {
        throw "Unable to find the APP_LEDGER_CHANNEL_DATA section";
      }

      const proofList = section.treeData.map(data => {
        const generator = new proofGenerator(data);

        return generator.generate(ref => DATA.PLAIN);
      });

      const encodedProof = schemaSerializer.encode(SCHEMAS.PROOF_LIST, { list: proofList });
      const b64 = base64.encodeBinary(encodedProof, base64.BASE64);

      return {
        height: n + 1,
        data: b64
      };
    });

    const obj = {
      information: {
        title: "Carmentis Proof File",
        exportTime: date.toJSON(),
        application: applicationName,
        applicationOperator: operatorName,
        issuer: this.issuer
      },
      proofData: {
        appLedgerId: this.vb.id,
        microblocks: microblocks
      }
    };

    return JSON.stringify(obj, null, 2);
  }
}
