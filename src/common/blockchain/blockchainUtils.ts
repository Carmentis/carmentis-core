import { SCHEMAS } from "../constants/constants";
import { SchemaSerializer, SchemaUnserializer } from "../data/schemaSerializer";
import { Crypto } from "../crypto/crypto";
import { Utils } from "../utils/utils";

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

function decodeMicroblockHeader(data: any) {
  const unserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_HEADER),
        object = unserializer.unserialize(data);

  return object;
}

function encodeMicroblockInformation(virtualBlockchainType: any, virtualBlockchainId: any, header: any) {
  const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_INFORMATION),
        data = serializer.serialize({ virtualBlockchainType, virtualBlockchainId, header });

  return data;
}

function decodeMicroblockInformation(data: any) {
  const unserializer = new SchemaUnserializer(SCHEMAS.MICROBLOCK_INFORMATION),
        object = unserializer.unserialize(data);

  return object;
}

function encodeVirtualBlockchainState(type: any, height: any, lastMicroblockHash: any, customStateObject: any) {
  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const customStateSerializer = new SchemaSerializer(SCHEMAS.VB_STATES[type]),
        customState = customStateSerializer.serialize(customStateObject);

  const stateObject = {
    type,
    height,
    lastMicroblockHash,
    customState
  };

  const stateSerializer = new SchemaSerializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE),
        data = stateSerializer.serialize(stateObject);

  return data;
}

function decodeVirtualBlockchainState(data: any) {
  const stateUnserializer = new SchemaUnserializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE),
        stateObject = stateUnserializer.unserialize(data);

  // @ts-expect-error TS(7053): Element implicitly has an 'any' type because expre... Remove this comment to see the full error message
  const customStateUnserializer = new SchemaUnserializer(SCHEMAS.VB_STATES[stateObject.type]),
        // @ts-expect-error TS(2339): Property 'customState' does not exist on type '{}'... Remove this comment to see the full error message
        customStateObject = customStateUnserializer.unserialize(stateObject.customState);

  // @ts-expect-error TS(2339): Property 'customState' does not exist on type '{}'... Remove this comment to see the full error message
  stateObject.customState = customStateObject;

  return stateObject;
}
