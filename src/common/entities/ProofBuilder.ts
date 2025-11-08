import {Hash} from "./Hash";
import {ApplicationLedger} from "../blockchain/ApplicationLedger";
import {AbstractPrivateDecryptionKey} from "../crypto/encryption/public-key-encryption/PublicKeyEncryptionSchemeInterface";

export class ProofBuilder {
    private constructor(
        private readonly virtualBlockchainId: Hash,
        private readonly appLedger: ApplicationLedger
    ) {}

    static createProofBuilder(virtualBlockchainId: Hash, appLedger: ApplicationLedger) {
        return new ProofBuilder(virtualBlockchainId, appLedger);
    }

    exportProofForEntireVirtualBlockchain( proofAuthor: string, hostPrivateDecryptionKey: AbstractPrivateDecryptionKey) {
        return this.appLedger.exportProof({ author: proofAuthor }, hostPrivateDecryptionKey);
    }
}