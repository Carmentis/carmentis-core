import {Crypto} from "../crypto/crypto";
import {Utils} from "./utils";
import {decode, encode} from 'cbor-x';

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
import {MicroblockInformation, MicroblockInformationSchema} from "../type/valibot/provider/MicroblockInformationSchema";
import {
    AccountBreakdown,
    AccountBreakdownSchema,
    AccountInformation,
    AccountInformationSchema,
    AccountState,
    AccountStateSchema,
    EscrowLock,
    EscrowLockSchema,
    EscrowParameters,
    EscrowParametersSchema,
    Lock,
    LockSchema,
    NodeStakingLock,
    NodeStakingLockSchema,
    NodeStakingParameters,
    NodeStakingParametersSchema,
    VestingLock,
    VestingLockSchema,
    VestingParameters,
    VestingParametersSchema
} from "../type/valibot/node/AccountInformation";
import {Logger} from "./Logger";

export class BlockchainUtils {
    static computeMicroblockHashFromHeader(previousMicroblockHeader: MicroblockHeader) {
        const serializedHeader = BlockchainSerializer.serializeMicroblockHeader(previousMicroblockHeader);
        return Crypto.Hashes.sha256AsBinary(serializedHeader);
    }

    /**
      Takes a list of consecutive microblock headers in binary format and in anti-chronological order.
      Returns an object with a flag telling if the hash chain is valid and the list of microblock hashes (also in anti-chronological order).
    */
    static checkHeaderList(serializedHeaders: Uint8Array[]) {
        // if the list of headers contains zero or one header, the verification succeed
        const numberOfHeaders = serializedHeaders.length;
        if (numberOfHeaders === 0) return { valid: true, hashes: [] }
        if (numberOfHeaders === 1) return { valid: true, hashes: [Crypto.Hashes.sha256AsBinary(serializedHeaders[0])] }

        // on the other cases (at least two headers), we have to start from the header before the last one, whose
        // the hash must match the previous hash of the last one, etc
        const hashes = [];
        let expectedHash = null;
        const logger = Logger.getProviderLogger();
        for (const header of serializedHeaders.reverse()) {
            const hash = Crypto.Hashes.sha256AsBinary(header);

            if (expectedHash && !Utils.binaryIsEqual(hash, expectedHash)) {
                logger.error(`Received headers mismatch: Expected ${Utils.binaryToHexa(expectedHash)}, got ${Utils.binaryToHexa(hash)}: aborting verification`)
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

    static encodeEscrowParameters(escrowParameters: EscrowParameters) {
        return encode(v.parse(EscrowParametersSchema, escrowParameters));
    }

    static decodeEscrowParameters(serializedEscrowParameters: Uint8Array): EscrowParameters {
        return v.parse(EscrowParametersSchema, decode(serializedEscrowParameters));
    }

    static encodeEscrowLock(escrowLock: EscrowLock) {
        return encode(v.parse(EscrowLockSchema, escrowLock));
    }

    static decodeEscrowLock(serializedEscrowLock: Uint8Array): EscrowLock {
        return v.parse(EscrowLockSchema, decode(serializedEscrowLock));
    }

    static encodeVestingParameters(vestingParameters: VestingParameters) {
        return encode(v.parse(VestingParametersSchema, vestingParameters));
    }

    static decodeVestingParameters(serializedVestingParameters: Uint8Array): VestingParameters {
        return v.parse(VestingParametersSchema, decode(serializedVestingParameters));
    }

    static encodeVestingLock(vestingLock: VestingLock) {
        return encode(v.parse(VestingLockSchema, vestingLock));
    }

    static decodeVestingLock(serializedVestingLock: Uint8Array): VestingLock {
        return v.parse(VestingLockSchema, decode(serializedVestingLock));
    }

    static encodeNodeStakingParameters(nodeStakingParameters: NodeStakingParameters) {
        return encode(v.parse(NodeStakingParametersSchema, nodeStakingParameters));
    }

    static decodeNodeStakingParameters(serializedNodeStakingParameters: Uint8Array): NodeStakingParameters {
        return v.parse(NodeStakingParametersSchema, decode(serializedNodeStakingParameters));
    }

    static encodeNodeStakingLock(nodeStakingLock: NodeStakingLock) {
        return encode(v.parse(NodeStakingLockSchema, nodeStakingLock));
    }

    static decodeNodeStakingLock(serializedNodeStakingLock: Uint8Array): NodeStakingLock {
        return v.parse(NodeStakingLockSchema, decode(serializedNodeStakingLock));
    }

    static encodeLock(lock: Lock) {
        return encode(v.parse(LockSchema, lock));
    }

    static decodeLock(serializedLock: Uint8Array): Lock {
        return v.parse(LockSchema, decode(serializedLock));
    }

    static encodeAccountBreakdown(accountBreakdown: AccountBreakdown) {
        return encode(v.parse(AccountBreakdownSchema, accountBreakdown));
    }

    static decodeAccountBreakdown(serializedAccountBreakdown: Uint8Array): AccountBreakdown {
        return v.parse(AccountBreakdownSchema, decode(serializedAccountBreakdown));
    }

    static encodeAccountState(accountState: AccountState) {
        return encode(v.parse(AccountStateSchema, accountState));
    }

    static decodeAccountState(serializedAccountState: Uint8Array): AccountState {
        return v.parse(AccountStateSchema, decode(serializedAccountState));
    }

    static encodeAccountInformation(accountInformation: AccountInformation) {
        return encode(v.parse(AccountInformationSchema, accountInformation));
    }

    static decodeAccountInformation(serializedAccountInformation: Uint8Array): AccountInformation {
        return v.parse(AccountInformationSchema, decode(serializedAccountInformation));
    }

    static encodeMicroblockInformation(microblockInformation: MicroblockInformation) {
        return encode(v.parse(MicroblockInformationSchema, microblockInformation));
    }

    static decodeMicroblockInformation(serializedMicroblockInformation: Uint8Array): MicroblockInformation {
        return v.parse(MicroblockInformationSchema, decode(serializedMicroblockInformation));
    }

}
