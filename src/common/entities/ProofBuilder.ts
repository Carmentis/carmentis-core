import {Hash} from "./Hash";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";

export class ProofBuilder {
    private constructor(
        private readonly virtualBlockchainId: Hash,
        private readonly appLedger: ApplicationLedger
    ) {}

    static createProofBuilder(virtualBlockchainId: Hash, appLedger: ApplicationLedger) {
        return new ProofBuilder(virtualBlockchainId, appLedger);
    }

    exportProofForEntireVirtualBlockchain( proofAuthor: string ) {
        return this.appLedger.exportProof({ author: proofAuthor })
    }
}