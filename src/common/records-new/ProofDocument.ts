import {Crypto} from '../crypto/crypto';
import {Utils} from '../utils/utils';
import {encode} from 'cbor-x';
import {
    ProofInfo,
    ProofChannel,
    ProofMicroblock,
    ProofWrapper,
} from './types';

export class ProofDocument {
    private author: string;
    private title: string;
    private description: string;
    private date: Date;
    private virtualBlockchainIdentifier: string;
    private microblocks: ProofMicroblock[];

    constructor() {
        this.title = "Carmentis proof";
        this.description = "This is a Carmentis proof file. Visit www.carmentis.io for more information.";
        this.author = "";
        this.date = new Date();
        this.virtualBlockchainIdentifier = "";
        this.microblocks = [];
    }

    setTitle(title: string) {
        this.title = title;
    }

    getTitle() {
        return this.title;
    }

    setDescription(description: string) {
        this.description = description;
    }

    getDescription() {
        return this.description;
    }

    setAuthor(author: string) {
        this.author = author;
    }

    getAuthor() {
        return this.author;
    }

    setDate(date: Date) {
        this.date = date;
    }

    getDate() {
        return this.date;
    }

    setVirtualBlockchainIdentifier(virtualBlockchainIdentifier: string) {
        this.virtualBlockchainIdentifier = virtualBlockchainIdentifier;
    }

    getVirtualBlockchainIdentifier() {
        return this.virtualBlockchainIdentifier;
    }

    addMicroblock(height: number, channels: ProofChannel[]) {
        this.microblocks.push({
            height,
            channels,
        })
    }

    getMicroblock(height: number) {
        const microblock = this.microblocks.find((m) => m.height === height);
        if (!microblock) {
            throw new Error(`no microblock found for height ${height}`);
        }
        return microblock;
    }

    getMicroblocks() {
        return this.microblocks;
    }

    sign() {
        const serializedContent = encode(this.microblocks);
        const contentHash = Crypto.Hashes.sha256AsBinary(serializedContent);
        const signedData = {
            date: this.date.toISOString(),
            virtualBlockchainIdentifier: this.virtualBlockchainIdentifier,
            hash: Utils.binaryToHexa(contentHash)
        };
        const serializedSignedData = encode(signedData);
        const signedHash = Crypto.Hashes.sha256AsBinary(serializedSignedData);
    }

    verifySignature() {
    }

    toJson(): ProofWrapper {
        const proof: ProofWrapper = {
            info: this.getInfo(),
            microblocks: this.microblocks
        };
        return proof;
    }

    private getInfo(): ProofInfo {
        return {
            title: this.title,
            date: this.date.toISOString(),
            description: this.description,
            author: this.author,
            virtualBlockchainIdentifier: this.virtualBlockchainIdentifier
        };
    }
}
