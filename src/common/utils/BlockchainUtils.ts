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
import {Section, SectionSchema} from "../type/valibot/blockchain/section/sections";
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
    }


    static encodeVirtualBlockchainInfo(virtualBlockchainInfo: VirtualBlockchainInfo) {
        return encode(v.parse(VirtualBlockchainInfoSchema, virtualBlockchainInfo));
    }

    static decodeVirtualBlockchainInfo(serializedInfo: Uint8Array) {
        return v.parse(VirtualBlockchainInfoSchema, decode(serializedInfo));
    }

    /**
     *
     * @param vbState
     */
    static encodeVirtualBlockchainState(vbState: VirtualBlockchainState) {
        return encode(v.parse(VirtualBlockchainStateSchema, vbState));
    }

    /**
     * Decodes a virtual blockchain state object from the given binary data.
     *
     * @param {Uint8Array} serializedVirtualBlockchainState The binary encoded virtual blockchain state data.
     * @return {VirtualBlockchainState} The decoded virtual blockchain state object.
     */
    static decodeVirtualBlockchainState(serializedVirtualBlockchainState: Uint8Array) : VirtualBlockchainState {
        return v.parse(VirtualBlockchainStateSchema, decode(serializedVirtualBlockchainState))
    }


    static encodeMicroblockBody(body: MicroblockBody) {
        return encode(v.parse(MicroblockBodySchema, body));
    }

    static decodeMicroblockBody(serializedBody: Uint8Array) {
        return v.parse(MicroblockBodySchema, decode(serializedBody));
    }

    static encodeSection(section: Section) {
        return encode(v.parse(SectionSchema, section));
    }

    static decodeSection(serializedSection: Uint8Array): Section {
        return v.parse(SectionSchema, decode(serializedSection));
    }

    static encodeMicroblockHeader(header: MicroblockHeader) {
        return encode(v.parse(MicroblockHeaderSchema, header));
    }

    static decodeMicroblockHeader(serializedHeader: Uint8Array) {
        return v.parse(MicroblockHeaderSchema, decode(serializedHeader));
    }

}
