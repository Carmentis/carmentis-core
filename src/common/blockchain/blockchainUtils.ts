import { SCHEMAS } from "../constants/constants";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer";
import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";

import {MicroblockInformationSchema, VirtualBlockchainStateInterface} from "./types";
import {MicroBlockHeaderSchema} from "../proto/section";
import {MicroBlockHeaderInterface} from "../entities/MicroBlockHeaderInterface";


export const BlockchainUtils = {
  checkHeaderList,
  previousHashFromHeader,
  decodeMicroblockHeader,
  encodeMicroblockInformation,
  decodeMicroblockInformation,
  encodeVirtualBlockchainState,
  decodeVirtualBlockchainState
};

/**
  Takes a list of consecutive microblock headers in binary format and in anti-chronological order.
  Returns an object with a flag telling if the hash chain is valid and the list of microblock hashes (also in anti-chronological order).
*/
function checkHeaderList(headers: any) {
  const hashes = [];
  let expectedHash = null;

  for(const header of headers) {
    const hash = Crypto.Hashes.sha256AsBinary(header);

    if(expectedHash && !Utils.binaryIsEqual(hash, expectedHash)) {
      return {
        valid: false,
        hashes: []
      };
    }

    hashes.push(hash);
    expectedHash = previousHashFromHeader(header);
  }

  return {
    valid: true,
    hashes: hashes
  };
}

/**
  Extracts the 'previousHash' field from a microblock header in binary format.
*/
function previousHashFromHeader(header: any) {
  return header.slice(
    SCHEMAS.MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET,
    SCHEMAS.MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET + 32
  );
}


function decodeMicroblockHeader(data: Uint8Array) {
  const unserializer = new SchemaUnserializer<MicroBlockHeaderInterface>(SCHEMAS.MICROBLOCK_HEADER);
  const object = unserializer.unserialize(data);

  return object;
}

function encodeMicroblockInformation(virtualBlockchainType: any, virtualBlockchainId: any, header: any) {
  const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_INFORMATION);
  const data = serializer.serialize({ virtualBlockchainType, virtualBlockchainId, header });

  return data;
}

function decodeMicroblockInformation(data: Uint8Array) {
  const unserializer = new SchemaUnserializer<MicroblockInformationSchema>(SCHEMAS.MICROBLOCK_INFORMATION);
  const object = unserializer.unserialize(data);

  return object;
}

/**
 *
 * @param type
 * @param height
 * @param lastMicroblockHash
 * @param customStateObject
 */
function encodeVirtualBlockchainState(type: number, height: number, lastMicroblockHash: Uint8Array, customStateObject: object) {
  const customStateSerializer = new SchemaSerializer(SCHEMAS.VB_STATES[type]);
  const customState = customStateSerializer.serialize(customStateObject);

  const stateObject = {
    type,
    height,
    lastMicroblockHash,
    customState
  };

  const stateSerializer = new SchemaSerializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE);
  const data = stateSerializer.serialize(stateObject);

  return data;
}

/**
 * Decodes a virtual blockchain state object from the given binary data.
 *
 * @param {Uint8Array} data The binary encoded virtual blockchain state data.
 * @return {VirtualBlockchainStateInterface} The decoded virtual blockchain state object.
 */
function decodeVirtualBlockchainState(data: Uint8Array) : VirtualBlockchainStateInterface {
  const stateUnserializer = new SchemaUnserializer<VirtualBlockchainStateInterface>(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE);
  const stateObject = stateUnserializer.unserialize(data);

  const customStateUnserializer = new SchemaUnserializer<VirtualBlockchainStateInterface>(SCHEMAS.VB_STATES[stateObject.type]);
  // @ts-ignore
  const customStateObject = customStateUnserializer.unserialize(stateObject.customState); // TODO: check here because we unserialize an object...

  // @ts-ignore
  stateObject.customState = customStateObject;

  return stateObject;
}
