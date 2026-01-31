import {Crypto} from '../crypto/crypto';
import {Utils} from '../utils/utils';
import {encode} from 'cbor-x';
import {
    ProofChannel,
    ProofMicroblock,
    ProofWrapper,
} from './types';

const PROOF_VERSION = 1;

export class ProofDocument {
    private wrapper: ProofWrapper;

    constructor() {
        this.wrapper = {
            info: {
                title: "Carmentis proof",
                description: "This is a Carmentis proof file. Visit www.carmentis.io for more information.",
                author: "",
                date: (new Date()).toISOString(),
                proofVersion: PROOF_VERSION,
                virtualBlockchainIdentifier: ""
            },
            microblocks: []
        };
    }

    fromProofWrapper(proofWrapper: ProofWrapper) {
        this.wrapper = proofWrapper;
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

    setVirtualBlockchainIdentifier(virtualBlockchainIdentifier: string) {
        this.wrapper.info.virtualBlockchainIdentifier = virtualBlockchainIdentifier;
    }

    getVirtualBlockchainIdentifier() {
        return this.wrapper.info.virtualBlockchainIdentifier;
    }

    addMicroblock(height: number, channels: ProofChannel[]) {
        const microblock: ProofMicroblock = {
            height,
            channels,
        };
        this.wrapper.microblocks.push(microblock);
    }

    getMicroblock(height: number): ProofMicroblock {
        const microblock = this.wrapper.microblocks.find((m) => m.height === height);
        if (!microblock) {
            throw new Error(`no microblock found for height ${height}`);
        }
        return microblock;
    }

    getMicroblocks(): ProofMicroblock[] {
        return this.wrapper.microblocks;
    }

    sign() {
        const serializedContent = encode(this.wrapper.microblocks);
        const contentHash = Crypto.Hashes.sha256AsBinary(serializedContent);
        const signedData = {
            date: this.wrapper.info.date,
            virtualBlockchainIdentifier: this.wrapper.info.virtualBlockchainIdentifier,
            hash: Utils.binaryToHexa(contentHash)
        };
        const serializedSignedData = encode(signedData);
        const signedHash = Crypto.Hashes.sha256AsBinary(serializedSignedData);
    }

    verifySignature() {
    }

    toJson(): ProofWrapper {
        return this.wrapper;
    }
}
