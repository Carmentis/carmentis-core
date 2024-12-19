import { ID, SECTIONS } from "../../constants/constants.js";
import { EXTERNAL_APP_DEF } from "./data.js";
import * as sectionSerializer from "../../serializers/section-serializer.js";
import * as crypto from "../../crypto/crypto.js";
import { log, outcome } from "../logger.js";

export async function run() {
  log("--- Testing sections ----");

  let serialized, unserialized, keyRing, object;

  keyRing = new Map;

  object = {
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "FR",
    website: "www.carmentis.io"
  };

  serialized = sectionSerializer.encode(
    123,
    0,
    ID.OBJ_ORGANIZATION,
    {
      id: SECTIONS.ORG_DESCRIPTION,
      object: object
    },
    keyRing
  );

  unserialized = sectionSerializer.decode(
    123,
    0,
    ID.OBJ_ORGANIZATION,
    serialized,
    keyRing
  );

  outcome("Internal schema (public data)", 50, JSON.stringify(unserialized.object) == JSON.stringify(object));

  let keyA = crypto.generateKey256(),
      keyB = crypto.generateKey256();

  keyRing.set(101 << 8 | 0, keyA);
  keyRing.set(101 << 8 | 1, keyB);

  let externalDef = EXTERNAL_APP_DEF;

  object = {
    name: "Carmentis SAS",
    city: "Paris",
    address: "2 rue de la Roquette, Cour de Mai",
    countryCode: "FR",
    website: "www.carmentis.io"
  };

  serialized = sectionSerializer.encode(
    123,
    0,
    ID.OBJ_APP_LEDGER,
    {
      id: SECTIONS.APP_LEDGER_CHANNEL_DATA,
      object: object
    },
    keyRing,
    externalDef,
    new Uint8Array()
  );

  delete externalDef.subsections;

  const EXPECTED = [
    { name: object.name, city: null, address: null, countryCode: null, website: null },
    { name: object.name, city: null, address: null, countryCode: null, website: object.website },
    { name: object.name, city: object.city, address: object.address, countryCode: object.countryCode, website: null },
    object
  ];

  for(let n = 0; n < 4; n++) {
    keyRing = new Map;

    if(n & 1) {
      keyRing.set(101 << 8 | 0, keyA);
    }
    if(n & 2) {
      keyRing.set(101 << 8 | 1, keyB);
    }

    unserialized = sectionSerializer.decode(
      123,
      0,
      ID.OBJ_ORGANIZATION,
      serialized,
      keyRing,
      externalDef,
      new Uint8Array()
    );

    outcome(`External schema / key combination #${n}`, 50, JSON.stringify(unserialized.object) == JSON.stringify(EXPECTED[n]));
  }
}
