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

  let success = JSON.stringify(unserialized.object) == JSON.stringify(object);

  if(!success) {
    console.log(unserialized);
  }

  outcome("Internal schema (public data)", 50, success);

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
    website: "www.carmentis.io",
    status: "active",
    emails: [ "foo@gmail.com", "bar@gmail.com" ],
    mainContact: { phoneNumber1: "00010101", phoneNumber2: "00020202" },
    contacts: [
      { phoneNumber1: "01010101", phoneNumber2: "01020202" },
      { phoneNumber1: "02010101", phoneNumber2: "02020202" }
    ],
    moreContacts: []
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
    {
      name: object.name,
      city: null,
      address: null,
      countryCode: null,
      website: null,
      status: null,
      emails: null,
      mainContact: null,
      contacts: null,
      moreContacts: null
    },
    {
      name: object.name,
      city: null,
      address: null,
      countryCode: null,
      website: object.website,
      status: object.status,
      emails: object.emails,
      mainContact: { phoneNumber1: object.mainContact.phoneNumber1, phoneNumber2: null },
      contacts: [
        { phoneNumber1: object.contacts[0].phoneNumber1, phoneNumber2: null },
        { phoneNumber1: object.contacts[1].phoneNumber1, phoneNumber2: null }
      ],
      moreContacts: []
    },
    {
      name: object.name,
      city: object.city,
      address: object.address,
      countryCode: object.countryCode,
      website: null,
      status: null,
      emails: null,
      mainContact: { phoneNumber1: null, phoneNumber2: object.mainContact.phoneNumber2 },
      contacts: [
        { phoneNumber1: null, phoneNumber2: object.contacts[0].phoneNumber2 },
        { phoneNumber1: null, phoneNumber2: object.contacts[1].phoneNumber2 }
      ],
      moreContacts: []
    },
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
      console.log(JSON.stringify(unserialized));
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
