import { SCHEMAS } from "../constants/constants";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer";
import { Crypto } from "../crypto/crypto";
import { Utils } from "./utils";

import {MicroblockInformationSchema, VirtualBlockchainStateInterface} from "../type/types";
import {MicroBlockHeaderDto} from "../entities/MicroBlockHeaderDto";


export const BlockchainUtils = {
  checkHeaderList,
  previousHashFromHeader,
  decodeMicroblockHeader,
  encodeMicroblockVbInformation,
  decodeMicroblockVbInformation,
  encodeVirtualBlockchainState,
  decodeVirtualBlockchainState,
  encodeVirtualBlockchainCustomState,
  decodeVirtualBlockchainCustomState
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
  const unserializer = new SchemaUnserializer<MicroBlockHeaderDto>(SCHEMAS.MICROBLOCK_HEADER);
  const object = unserializer.unserialize(data);

  return object;
}

function encodeMicroblockVbInformation(virtualBlockchainType: number, virtualBlockchainId: Uint8Array) {
  const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_VB_INFORMATION);
  const data = serializer.serialize({ virtualBlockchainType, virtualBlockchainId });

  return data;
}

function decodeMicroblockVbInformation(data: Uint8Array) {
  const unserializer = new SchemaUnserializer<MicroblockInformationSchema>(SCHEMAS.MICROBLOCK_VB_INFORMATION);
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
function encodeVirtualBlockchainState(type: number, expirationDay: number, height: number, lastMicroblockHash: Uint8Array, customStateObject: object) {
  const customState = encodeVirtualBlockchainCustomState(type, customStateObject);

  const stateObject = {
    type,
    expirationDay,
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
  // @ts-ignore
  const customStateObject = decodeVirtualBlockchainCustomState(stateObject.type, stateObject.customState);

  // @ts-ignore
  stateObject.customState = customStateObject;

  return stateObject;
}

/**
 *
 * @param type
 * @param customStateObject
 */
function encodeVirtualBlockchainCustomState(type: number, customStateObject: object) {
  const customStateSerializer = new SchemaSerializer(SCHEMAS.VB_STATES[type]);
  return customStateSerializer.serialize(customStateObject);
}

/**
 *
 * @param type
 * @param {Uint8Array} data
 */
function decodeVirtualBlockchainCustomState(type: number, data: Uint8Array) {
  const customStateUnserializer = new SchemaUnserializer(SCHEMAS.VB_STATES[type]);
  return customStateUnserializer.unserialize(data);
}
