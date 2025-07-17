import {ImportedProof} from "../blockchain/types";
import {MicroblockImporter} from "../blockchain/MicroblockImporter";
import {IllegalParameterError} from "../errors/carmentis-error";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Optional} from "./Optional";
import {Height} from "./Height";
import {Hash} from "./Hash";

/**
 * Represents the result of a proof verification process, encapsulating the verified data and
 * providing methods to check the validity of various elements of the proof.
 */
export class ProofVerificationResult {
    private constructor(
        private verified: boolean,
        private appLedger: ApplicationLedger,
        private importedProofs: Optional<ImportedProof[]>,
    ) {}

    static createSuccessfulProofVerificationResult(appLedger: ApplicationLedger, data: ImportedProof[]) {
        return new ProofVerificationResult(true, appLedger, Optional.some(data));
    }

    static createFailedProofVerificationResult(appLedger: ApplicationLedger) {
        return new ProofVerificationResult(false, appLedger, Optional.none());
    }

    /**
     * Checks if the current state is verified.
     *
     * @return {boolean} Returns true if verified, otherwise false.
     */
    isVerified(): boolean {
        return this.verified
    }

    /**
     * Retrieves the heights of the involved blocks based on the imported proofs.
     *
     * If there are imported proofs, the method returns an array of block heights
     * extracted from the proofs. If there are no imported proofs, it returns an empty array.
     *
     * @return {Height[]} An array of block heights involved in the imported proofs,
     * or an empty array if no proofs are available.
     */
    getInvolvedBlockHeights(): Height[] {
        if (this.importedProofs.isSome()) {
            return this.importedProofs.unwrap().map(importedProof => importedProof.height)
        } else {
            return []
        }
    }


    /**
     * Retrieves the ledger ID of the application as a hash.
     *
     * @return {Hash} The virtual blockchain ID associated with the application's ledger.
     */
    getApplicationLedgerId(): Hash {
        return this.appLedger.getVirtualBlockchainId()
    }


    /**
     * Retrieves the record contained within a block at the specified height.
     *
     * @param {Height} blockHeight - The height of the block from which the record is to be retrieved.
     * @return {T} The record contained within the block at the given height.
     * @throws {IllegalParameterError} If a block at the specified height is not found.
     */
    async getRecordContainedInBlockAtHeight<T>(blockHeight: Height): Promise<T> {
       return await this.appLedger.getRecord(blockHeight) as T
    }
}