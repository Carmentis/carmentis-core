import * as DATA from "./data.js";
import * as CHAIN from "./chain.js";

// ============================================================================================================================ //
//  Account                                                                                                                     //
// ============================================================================================================================ //
const ACCOUNT = {};

// ============================================================================================================================ //
//  Validator node                                                                                                              //
// ============================================================================================================================ //
const VALIDATOR_NODE = {};

// ============================================================================================================================ //
//  Organization                                                                                                                //
// ============================================================================================================================ //
export const ORG_PUBLIC_KEY  = 0;
export const ORG_DESCRIPTION = 1;
export const ORG_SERVER      = 2;
export const ORG_SIGNATURE   = 3;

const ORGANIZATION = {
  [ ORG_PUBLIC_KEY ]: {
    label: "ORG_PUBLIC_KEY",
    schema: [
      { name: "publicKey", type: DATA.TYPE_BINARY }
    ]
  },
  [ ORG_DESCRIPTION ]: {
    label: "ORG_DESCRIPTION",
    schema: [
      { name: "name",        type: DATA.TYPE_STRING },
      { name: "city",        type: DATA.TYPE_STRING },
      { name: "countryCode", type: DATA.TYPE_STRING, size: 2 },
      { name: "website",     type: DATA.TYPE_STRING }
    ]
  },
  [ ORG_SERVER ] : {
    label: "ORG_SERVER",
    schema: [
      { name: "endpoint", type: DATA.TYPE_STRING }
    ]
  },
  [ ORG_SIGNATURE ]: {
    label: "ORG_SIGNATURE",
    schema: [
      { name: "signature", type: DATA.TYPE_BINARY }
    ]
  }
};

// ============================================================================================================================ //
//  Application                                                                                                                 //
// ============================================================================================================================ //
const APPLICATION = {};

// ============================================================================================================================ //
//  Application ledger                                                                                                          //
// ============================================================================================================================ //
const APP_LEDGER = {};

// ============================================================================================================================ //
//  All sections                                                                                                                //
// ============================================================================================================================ //
export const DEF = {
  [ CHAIN.VB_ACCOUNT        ]: ACCOUNT,
  [ CHAIN.VB_VALIDATOR_NODE ]: VALIDATOR_NODE,
  [ CHAIN.VB_ORGANIZATION   ]: ORGANIZATION,
  [ CHAIN.VB_APPLICATION    ]: APPLICATION,
  [ CHAIN.VB_APP_LEDGER     ]: APP_LEDGER
};
