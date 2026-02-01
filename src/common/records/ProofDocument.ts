import {Crypto} from '../crypto/crypto';
import {Utils} from '../utils/utils';
import {ProofDocumentVB} from './ProofDocumentVB';
import {encode} from 'cbor-x';
import * as v from 'valibot';
import {
    ProofSignatureCommitment,
    ProofWrapper,
} from './types';

const PROOF_VERSION = 1;

export class ProofDocument {
    private wrapper: ProofWrapper;

    constructor() {
        this.wrapper = {
            version: PROOF_VERSION,
            info: {
                title: "Carmentis proof",
                description: "This is a Carmentis proof file. Visit www.carmentis.io for more information.",
                author: "",
                date: (new Date()).toISOString(),
            },
            virtual_blockchains: [],
        };
    }

    static fromObject(proofWrapper: ProofWrapper) {
        const doc = new ProofDocument();
        doc.wrapper = proofWrapper;
        return doc;
    }

    setTitle(title: string) {
        this.wrapper.info.title = title;
    }

    getTitle() {
        return this.wrapper.info.title;
    }

    setDescription(description: string) {
        this.wrapper.info.description = description;
    }

    getDescription() {
        return this.wrapper.info.description;
    }

    setAuthor(author: string) {
        this.wrapper.info.author = author;
    }

    getAuthor() {
        return this.wrapper.info.author;
    }

    setDate(date: Date) {
        this.wrapper.info.date = date.toISOString();
    }

    getDate() {
        return new Date(this.wrapper.info.date);
    }

    addVirtualBlockchain(proofDocumentVB: ProofDocumentVB) {
        this.wrapper.virtual_blockchains.push(proofDocumentVB.toObject());
    }

    getVirtualBlockchain(virtualBlockchainIdentifier: string) {

    }

    getVirtualBlockchains() {
        return this.wrapper.virtual_blockchains.map((vb) =>
            ProofDocumentVB.fromObject(vb)
        );
    }

    sign(issuedAt: Date = new Date) {
        const digest = this.computeDigest();
        const commitment: ProofSignatureCommitment = {
            issued_at: issuedAt.toISOString(),
            digest_alg: 'sha256',
            digest_target: 'cbor_proof',
            digest: Utils.binaryToHexa(digest),
        };
        const serializedCommitment = encode(commitment);
        const commitmentHash = Crypto.Hashes.sha256AsBinary(serializedCommitment);
        const sig = '';
        this.wrapper.signature = {
            commitment,
            signer: '',
            pubkey: '',
            alg: 'ed25519',
            sig,
        };
    }

    verifySignature() {
        const digest = this.computeDigest();
    }

    computeDigest() {
        const signedContent = {
            info: this.wrapper.info,
            virtual_blockchains: this.wrapper.virtual_blockchains,
        }
        const serializedSignedContent = encode(signedContent);
        const signedContentHash = Crypto.Hashes.sha256AsBinary(serializedSignedContent);
        return signedContentHash;
    }

    getObject(): ProofWrapper {
        return this.wrapper;
    }
}
