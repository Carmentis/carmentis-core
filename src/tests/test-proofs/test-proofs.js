import * as sectionSerializer from "../../common/serializers/section-serializer.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import { DATA, ID, SCHEMAS, SECTIONS } from "../../common/constants/constants.js";
import { proofGenerator, proofDecoder } from "../../common/proofs/field-merklizer.js";
import * as crypto from "../../common/crypto/crypto.js";
import * as debug from "../../common/util/debug.js";
import { EXTERNAL_APP_DEF } from "./data.js";
import { log, outcome } from "../logger.js";

export async function run() {
  log("--- Testing proofs ----");

  let object,
      keyRing;

  async function keyManager(keyId, index) {
    return keyRing.get(keyId | index);
  }

  keyRing = new Map();

  let keyA = crypto.generateKey256(),
      keyB = crypto.generateKey256(),
      keyC = crypto.generateKey256();

  keyRing.set(SECTIONS.KEY_CHANNEL | 1, keyA);
  keyRing.set(SECTIONS.KEY_CHANNEL | 2, keyB);
  keyRing.set(SECTIONS.KEY_CHANNEL | 3, keyC);

  let externalDef = EXTERNAL_APP_DEF;

  // Channel #1: website, optionalField, optionalStruct, array
  // Channel #2: countryCode
  // Channel #3: city, address
  object = {
    name: "Carmentis SAS",                        // 0
    city: "Paris",                                // 1
    address: {                                    // 2
      line1: "2 rue de la Roquette, Cour de Mai", // 2,0
      line2: "75012 Paris"                        // 2,1
    },                                            //
    countryCode: "FR",                            // 3
    website: "www.carmentis.io",                  // 4
    array: [ "A", "B", "C" ],                     // 5
    optionalField: "optional",                    // 6
    optionalStruct: {                             // 7
      someField: "someField"                      // 7,0
    }                                             //
  };

  let encoded = await sectionSerializer.encode(
    123,
    0,
    ID.OBJ_APP_LEDGER,
    {
      id: SECTIONS.APP_LEDGER_CHANNEL_DATA,
      object: object
    },
    keyManager,
    externalDef,
    new Uint8Array()
  );

  let decoded = await sectionSerializer.decode(
    123,
    0,
    ID.OBJ_APP_LEDGER,
    encoded,
    keyManager,
    externalDef
  );

//console.log(debug.jsonDump(decoded));

  let proofList = decoded.treeData.map(data => {
    let generator = new proofGenerator(data);

    return generator.generate(ref => { return ref+"" == "2,0" || ref+"" == "6" ? DATA.REDACTED : DATA.PLAIN; });
  });

  let encodedProof = schemaSerializer.encode(SCHEMAS.PROOF_LIST, { list: proofList });

  console.log(encodedProof);

  proofList = schemaSerializer.decode(SCHEMAS.PROOF_LIST, encodedProof).list;

  console.log(proofList);

  proofList = proofList.map(proofData => {
    let decoder = new proofDecoder(proofData);

    return decoder.decode();
  });

  let decodedObject = sectionSerializer.decodeFromProof(ID.OBJ_APP_LEDGER, encoded, proofList, externalDef);

  console.log(decodedObject);
}
