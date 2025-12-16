import {SCHEMAS} from "../constants/constants";
import {SchemaSerializer, SchemaUnserializer} from "../data/schemaSerializer";
import {Crypto} from "../crypto/crypto";
import {Utils} from "./utils";
import {encode, decode} from 'cbor-x';

import {BlockchainSerializer} from "../data/BlockchainSerializer";
import {MicroblockHeader, MicroblockHeaderSchema} from "../type/valibot/blockchain/microblock/MicroblockHeader";
import {MicroblockBody, MicroblockBodySchema} from "../type/valibot/blockchain/microblock/MicroblockBody";
import * as v from 'valibot';
import {
    VirtualBlockchainState,
    VirtualBlockchainStateSchema
} from "../type/valibot/blockchain/virtualBlockchain/virtualBlockchains";
import {Section} from "../type/valibot/blockchain/section/sections";
import {VirtualBlockchainInfo, VirtualBlockchainInfoSchema} from "../type/valibot/provider/VirtualBlockchainInfo";

export class BlockchainUtils {
    static computeMicroblockHashFromHeader(previousMicroblockHeader: MicroblockHeader) {
        const serializedHeader = BlockchainSerializer.serializeMicroblockHeader(previousMicroblockHeader);
        return Crypto.Hashes.sha256AsBinary(serializedHeader);
    }

    /**
      Takes a list of consecutive microblock headers in binary format and in anti-chronological order.
      Returns an object with a flag telling if the hash chain is valid and the list of microblock hashes (also in anti-chronological order).
    */
    static checkHeaderList(headers: Uint8Array[]) {
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
            expectedHash = BlockchainUtils.previousHashFromHeader(header);
        }

        return {
            valid: true,
            hashes: hashes
        };
    }

    /**
      Extracts the 'previousHash' field from a microblock header in binary format.
    */
    static previousHashFromHeader(serializedHeader: Uint8Array) {
        const header = BlockchainSerializer.unserializeMicroblockHeader(serializedHeader);
        return header.previousHash;
        /*
      return header.slice(
        SCHEMAS.MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET,
        SCHEMAS.MICROBLOCK_HEADER_PREVIOUS_HASH_OFFSET + 32
      );

         */
    }

    /*
    static decodeMicroblockHeader(serializedHeader: Uint8Array) {
        return BlockchainSerializer.unserializeMicroblockHeader(serializedHeader)

      const unserializer = new SchemaUnserializer<MicroBlockHeaderDto>(SCHEMAS.MICROBLOCK_HEADER);
      const object = unserializer.unserialize(data);

      return object;


    }

     */

    /*
    static decodeMicroblockBody(serializedBody: Uint8Array) {
        const unserializer = new SchemaUnserializer<MicroblockBody>(SCHEMAS.MICROBLOCK_BODY);
        const object = unserializer.unserialize(serializedBody);

        return object;
    }

     */


    static encodeVirtualBlockchainInfo(virtualBlockchainInfo: VirtualBlockchainInfo) {
        return encode(virtualBlockchainInfo);
    }

    static decodeVirtualBlockchainInfo(serializedInfo: Uint8Array) {
        return v.parse(VirtualBlockchainInfoSchema, decode(serializedInfo));
    }

    /*
    static encodeMicroblockVbInformation(virtualBlockchainType: number, virtualBlockchainId: Uint8Array) {
        const serializer = new SchemaSerializer(SCHEMAS.MICROBLOCK_VB_INFORMATION);
        const data = serializer.serialize({ virtualBlockchainType, virtualBlockchainId });

        return data;
    }

    static decodeMicroblockVbInformation(data: Uint8Array) {
        const unserializer = new SchemaUnserializer<MicroblockInformationSchema>(SCHEMAS.MICROBLOCK_VB_INFORMATION);
        const object = unserializer.unserialize(data);

        return object;
    }


     */
    /**
     *
     * @param vbState
     */
    static encodeVirtualBlockchainState(vbState: VirtualBlockchainState) {
        return encode(vbState);
        /*
        const stateObject:  = {
            type: vbState.type,
            expirationDay: vbState.expirationDay,
            height: vbState.height,
            lastMicroblockHash: vbState.lastMicroblockHash,
            serializedInternalState: BlockchainUtils.encodeVirtualBlockchainInternalState(
                vbState.type,
                vbState.internalState
            )
        };

        const stateSerializer = new SchemaSerializer(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE);
        const data = stateSerializer.serialize(stateObject);

        return data;

         */
    }

    /**
     * Decodes a virtual blockchain state object from the given binary data.
     *
     * @param {Uint8Array} serializedVirtualBlockchainState The binary encoded virtual blockchain state data.
     * @return {VirtualBlockchainState} The decoded virtual blockchain state object.
     */
    static decodeVirtualBlockchainState(serializedVirtualBlockchainState: Uint8Array) : VirtualBlockchainState {
        return v.parse(VirtualBlockchainStateSchema, serializedVirtualBlockchainState)
        /*
        const stateUnserializer = new SchemaUnserializer<VirtualBlockchainStateDto>(SCHEMAS.VIRTUAL_BLOCKCHAIN_STATE);
        const stateObject = stateUnserializer.unserialize(data);
        const vbState: VirtualBlockchainState = {
            expirationDay: stateObject.expirationDay,
            lastMicroblockHash: stateObject.lastMicroblockHash,
            type: stateObject.type,
            height: stateObject.height,
            internalState: BlockchainUtils.decodeVirtualBlockchainInternalState<object>(
                stateObject.type,
                stateObject.serializedInternalState
            )
        }
        return vbState;

         */
    }

    /**
     *
     * @param type
     * @param internalState
     */
    static encodeVirtualBlockchainInternalState(type: number, internalState: unknown) {
        const customStateSerializer = new SchemaSerializer(SCHEMAS.VB_STATES[type]);
        return customStateSerializer.serialize(internalState);
    }

    /**
     *
     * @param type
     * @param {Uint8Array} data
     */
    static decodeVirtualBlockchainInternalState<T>(type: number, data: Uint8Array) {
        const customStateUnserializer = new SchemaUnserializer(SCHEMAS.VB_STATES[type]);
        return customStateUnserializer.unserialize(data) as T;
    }

    static encodeMicroblockBody(body: MicroblockBody) {
        return encode(body);
    }

    static decodeMicroblockBody(serializedBody: Uint8Array) {
        return v.parse(MicroblockBodySchema, decode(serializedBody));
    }

    static encodeSection(section: Section) {
        return encode(section);
    }

    static encodeMicroblockHeader(header: MicroblockHeader) {
        return encode(header);
    }

    static decodeMicroblockHeader(serializedHeader: Uint8Array) {
        return v.parse(MicroblockHeaderSchema, decode(serializedHeader));
    }

}
