import {ImportedProof} from "../blockchain/types";
import {MicroblockImporter} from "../blockchain/MicroblockImporter";
import {IllegalParameterError} from "../errors/carmentis-error";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {Optional} from "./Optional";
import {Height} from "./Height";

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
     * Asynchronously checks if the proof is verified.
     *
     * @return {Promise<boolean>} A promise that resolves to true if the proof is verified, false otherwise.
     */
    async isVerified(): Promise<boolean> {
        return this.verified
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