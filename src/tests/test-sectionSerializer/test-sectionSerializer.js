import * as sectionSerializer from "../../common/serializers/section-serializer.js";
import * as schemaSerializer from "../../common/serializers/schema-serializer.js";
import * as crypto from "../../common/crypto/crypto.js";
import { ID, SCHEMAS, SECTIONS } from "../../common/constants/constants.js";
import { EXTERNAL_APP_DEF } from "./data.js";
import { log, outcome } from "../logger.js";

export async function run() {
  log("--- Testing sections ----");

  let serialized,
      unserialized,
      object,
      keyRing;

  async function keyManager(keyId, index) {
    return keyRing.get(keyId | index);
  }

  keyRing = new Map;

  object = {
    name: "Carmentis SAS",
    city: "Paris",
    countryCode: "FR",
    website: "www.carmentis.io"
  };

  serialized = await encode(
    123,
    0,
    ID.OBJ_ORGANIZATION,
    {
      id: SECTIONS.ORG_DESCRIPTION,
      object: object
    },
    keyManager
  );

  unserialized = await decode(
    123,
    0,
    ID.OBJ_ORGANIZATION,
    serialized,
    keyManager
  );

  outcome("Internal schema (public data)", 50, JSON.stringify(unserialized.object) == JSON.stringify(object));

  let keyA = crypto.generateKey256(),
      keyB = crypto.generateKey256();

  keyRing.set(SECTIONS.KEY_CHANNEL | 1, keyA);
  keyRing.set(SECTIONS.KEY_CHANNEL | 2, keyB);

  let externalDef = EXTERNAL_APP_DEF;

  object = {
    name: "Carmentis SAS",
    city: "Paris",
    address: "2 rue de la Roquette, Cour de Mai",
    countryCode: "FR",
    website: "www.carmentis.io"
  };

  serialized = await encode(
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
      keyRing.set(SECTIONS.KEY_CHANNEL | 1, keyA);
    }
    if(n & 2) {
      keyRing.set(SECTIONS.KEY_CHANNEL | 2, keyB);
    }

    unserialized = await decode(
      123,
      0,
      ID.OBJ_ORGANIZATION,
      serialized,
      keyManager,
      externalDef,
      new Uint8Array()
    );

    let success = JSON.stringify(unserialized.object) == JSON.stringify(EXPECTED[n]);

    if(!success) {
      console.log(unserialized);
    }

    outcome(`External schema / key combination #${n}`, 50, success);
  }
}

async function encode(...arg) {
  let encoded = await sectionSerializer.encode(...arg);

  return schemaSerializer.encode(SCHEMAS.SECTION, encoded);
}

async function decode(...arg) {
  arg[3] = schemaSerializer.decode(SCHEMAS.SECTION, arg[3]);

  return await sectionSerializer.decode(...arg);
}
