import {
    AccountCreationSectionSchema,
    AccountPublicKeySectionSchema,
    AccountSigAlgorithmSectionSchema,
    AccountSignatureSectionSchema,
    AccountTokenIssuanceSectionSchema,
    AccountTransferSectionSchema,
    AppDeclarationSectionSchema,
    AppDescriptionSectionSchema,
    AppLedgerActorCreationSectionSchema,
    AppLedgerActorSubscriptionSectionSchema,
    AppLedgerAuthorSectionSchema,
    AppLedgerAuthorSignatureSectionSchema,
    AppLedgerChannelCreationSectionSchema,
    AppLedgerChannelInvitationSectionSchema,
    AppLedgerDeclarationSectionSchema,
    AppLedgerEndorserSectionSchema,
    AppLedgerEndorserSignatureSectionSchema,
    AppLedgerPrivateChannelDataSectionSchema,
    AppLedgerPublicChannelDataSectionSchema,
    AppLedgerSharedSecretSectionSchema,
    AppLedgerSigAlgorithmSectionSchema,
    AppSigAlgorithmSectionSchema,
    AppSignatureSectionSchema,
    MicroBlockType,
    OrgDescriptionSectionSchema,
    OrgPublicKeySectionSchema,
    OrgServerSectionSchema,
    OrgSigAlgorithmSectionSchema,
    OrgSignatureSectionSchema,
    SectionType
} from "../proto/section";
import {Section} from "./Section";
import {CMTSToken} from "../economics/currencies/token";
import {CarmentisError, SectionNotFoundError} from "../errors/carmentis-error";
import {PublicSignatureKey, SignatureAlgorithmId} from "../crypto/signature/signature-interface";
import {StringSignatureEncoder} from "../crypto/signature/signature-encoder";
import {MicroBlockSectionConstraint} from "./MicroBlockSectionConstraint";
import {MicroBlockHeaderInterface} from "./MicroBlockHeaderInterface";
import {MicroBlockHeader} from "./MicroBlockHeader";
import {Hash} from "./Hash";

export abstract class AbstractMicroBlock {
    private feesPayerAccount?: Uint8Array;
    
    constructor(
        private header: MicroBlockHeaderInterface,
        private sections: Section[],
    ) {}

    abstract getMicroBlockType(): MicroBlockType;

    getMicroBlockHeader(): MicroBlockHeader {
        const header = this.header
        return new class extends MicroBlockHeader {
            getBodyHash = () => Hash.from(header.bodyHash);
            getGas = () => CMTSToken.createAtomic(header.gas)
            getGasPrice = () => CMTSToken.createAtomic(header.gasPrice);
            getHeight = () => header.height;
            getMagicString = () => header.magicString;
            getPreviousHash = () => Hash.from(header.previousHash);
            getProtocolVersion = () => header.protocolVersion;
        }
    }

    getMicroBlockHeight(): number {
        return this.header.height;
    }
    
    getGas(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gas);
    }
    
    addSection(section: Section) {
        this.sections.push(section);
    }

    findSectionByType<T>(type: SectionType) {
        const result = this.sections.find(section => section.getSectionType() == type);
        if (result === undefined) throw new SectionNotFoundError(type);
        return result as Section<T>;
    }

    findAllSectionsByType(type: SectionType) {
        return this.sections.filter(section => section.getSectionType() == type);
    }

    
    getGasPrice(): CMTSToken {
        return CMTSToken.createAtomic(this.header.gasPrice);
    }

    getMicroBlockHash(): Hash {
        throw new CarmentisError("Not implemented");
    }


    setFeesPayerAccount(account: Hash) {
        this.feesPayerAccount = account.toBytes();
    }
    
    searchSectionsByType(sectionType: SectionType): Section[] {
        return this.sections.filter(section => section.isSectionType(sectionType));
    }

    containsValidSections(): boolean {
        const constraint = this.getSectionConstraints();
        return constraint.checkIfConstraintAreSatisfied(this.sections);
    }


    hasSignedMicroBlock( publicKey: PublicSignatureKey, signature: Uint8Array ): boolean {
        const message = this.getDataToSign();
        return publicKey.verify(message, signature);
    }

    /**
     * Returns the bytes representation of this micro-block that can be signed
     */
    getDataToSign(): Uint8Array {
        const headerBytes = this.encodeHeader();
        const bodyBytes = this.encodeBody();
        return new Uint8Array([...headerBytes, ...bodyBytes]);
    }
    
    protected abstract encodeBody(): Uint8Array; 



    private encodeHeader(): Uint8Array {
        const headerBuffer = new Uint8Array(1024); // Pre-allocate buffer
        let offset = 0;

        // Encode fixed string fields
        const encoder = new TextEncoder();
        const magicBytes = encoder.encode(this.header.magicString);
        headerBuffer.set(magicBytes, offset);
        offset += magicBytes.length;

        // Encode numeric fields 
        const view = new DataView(headerBuffer.buffer);
        view.setUint32(offset, this.header.protocolVersion);
        offset += 4;
        view.setBigUint64(offset, BigInt(this.header.height));
        offset += 8;
        headerBuffer.set(this.header.previousHash, offset);
        offset += this.header.previousHash.length;
        view.setBigUint64(offset, BigInt(this.header.timestamp));
        offset += 8;
        view.setBigUint64(offset, BigInt(this.header.gas));
        offset += 8;
        view.setBigUint64(offset, BigInt(this.header.gasPrice));
        offset += 8;
        headerBuffer.set(this.header.bodyHash, offset);
        offset += this.header.bodyHash.length;

        return headerBuffer.slice(0, offset);
    }

    abstract getSectionConstraints(): MicroBlockSectionConstraint;
}



// --------------------------------------------------------------------------------------------------------------------
// Application
export abstract class AppDescription {
    abstract getName(): string;
    abstract getLogoUrl(): string;
    abstract getHomepageUrl(): string;
    abstract getDescription(): string;
}


export class ApplicationMicroBlock extends AbstractMicroBlock {
    protected encodeBody(): Uint8Array {
        return new Uint8Array(0);
    }

    getMicroBlockType(): MicroBlockType {
        return MicroBlockType.APPLICATION_MICROBLOCK
    }

    getSectionConstraints(): MicroBlockSectionConstraint {
        const constraint = new MicroBlockSectionConstraint();
        // TODO add application constraint
        return constraint;
    }

    getDescription(): AppDescription {
        const section = this.findSectionByType<AppDescriptionSectionSchema>(SectionType.APP_DESCRIPTION);
        const data = section.getData();
        return new class extends AppDescription {
            getName = () => data.name;
            getLogoUrl = () => data.logoUrl;
            getHomepageUrl = () => data.homepageUrl;
            getDescription = () => data.description;
        };
    }

    getSigAlgorithm(): SignatureAlgorithmId {
        const section = this.findSectionByType<AppSigAlgorithmSectionSchema>(SectionType.APP_SIG_ALGORITHM);
        return section.getData().algorithmId;
    }

    getDeclarationOrgId(): Hash {
        const section = this.findSectionByType<AppDeclarationSectionSchema>(SectionType.APP_DECLARATION);
        return Hash.from(section.getData().organizationId);
    }

    getSignature(): Uint8Array {
        const section = this.findSectionByType<AppSignatureSectionSchema>(SectionType.APP_SIGNATURE);
        return section.getData().signature;
    }
}


// --------------------------------------------------------------------------------------------------------------------
// Organisation



export abstract class OrgDescription {
    abstract getName(): string;

    abstract getCity(): string;

    abstract getCountryCode(): string;

    abstract getWebsite(): string;

}

export class OrganisationMicroBlock extends AbstractMicroBlock {
    protected encodeBody(): Uint8Array {
        return new Uint8Array(0);
    }

    getMicroBlockType(): MicroBlockType {
        return MicroBlockType.ORGANISATION_MICROBLOCK;
    }

    getSectionConstraints(): MicroBlockSectionConstraint {
        const constraint = new MicroBlockSectionConstraint();
        constraint.addExactlyOneSectionConstraint(SectionType.ORG_SIG_ALGORITHM);
        constraint.addExactlyOneSectionConstraint(SectionType.ORG_PUBLIC_KEY);
        constraint.addExactlyOneSectionConstraint(SectionType.ORG_DESCRIPTION);
        constraint.addExactlyOneSectionConstraint(SectionType.ORG_SERVER);
        constraint.addExactlyOneSectionConstraint(SectionType.ORG_SIGNATURE);
        return constraint;
    }

    getSigAlgorithm(): SignatureAlgorithmId {
        const section = this.findSectionByType<OrgSigAlgorithmSectionSchema>(SectionType.ORG_SIG_ALGORITHM);
        const data = section.getData();
        return data.algorithmId;
    }

    getPublicKey(): PublicSignatureKey {
        const section = this.findSectionByType<OrgPublicKeySectionSchema>(SectionType.ORG_PUBLIC_KEY);
        const data = section.getData();
        const signatureEncoder = StringSignatureEncoder.defaultBytesSignatureEncoder();
        return signatureEncoder.decodePublicKey(data.publicKey)
    }

    getDescription(): OrgDescription {
        const section = this.findSectionByType<OrgDescriptionSectionSchema>(SectionType.ORG_DESCRIPTION);
        const data = section.getData();
        return new class extends OrgDescription {
            getName = () => data.name;
            getCity = () => data.city;
            getCountryCode = () => data.countryCode;
            getWebsite = () => data.website;
        };
    }

    getServer(): string {
        const section = this.findSectionByType<OrgServerSectionSchema>(SectionType.ORG_SERVER);
        const data = section.getData();
        return data.endpoint;
    }

    getSignature(): Uint8Array {
        const section = this.findSectionByType<OrgSignatureSectionSchema>(SectionType.ORG_SIGNATURE);
        const data = section.getData();
        return data.signature;
    }
}


// --------------------------------------------------------------------------------------------------------------------
// Account


export abstract class AccountTransfer {
    abstract getAccount(): Hash;
    abstract getAmount(): CMTSToken;
    abstract getPublicReference(): string;
    abstract getPrivateReference(): string;
}

export abstract class AccountCreation {
    abstract getSellerAccount(): Hash;
    abstract getAmount(): CMTSToken;
}


export class AccountMicroBlock extends AbstractMicroBlock {
    getSectionConstraints(): MicroBlockSectionConstraint {
        const constraints = new MicroBlockSectionConstraint();
        constraints.addAtMostSectionConstraint(SectionType.ACCOUNT_PUBLIC_KEY, 1);
        constraints.addAtMostSectionConstraint(SectionType.ACCOUNT_CREATION, 1);
        return constraints
    }

    getMicroBlockType(): MicroBlockType {
        return MicroBlockType.ACCOUNT_MICROBLOCK
    }

    protected encodeBody(): Uint8Array {
        return new Uint8Array(0);
    }

    getSignatureAlgorithm(): number {
        const section = this.findSectionByType<AccountSigAlgorithmSectionSchema>(SectionType.ACCOUNT_SIG_ALGORITHM);
        return section.getData().algorithmId;
    }

    getPublicKey(): Uint8Array {
        const section = this.findSectionByType<AccountPublicKeySectionSchema>(SectionType.ACCOUNT_PUBLIC_KEY);
        return section.getData().publicKey;
    }

    getTokenIssuance(): CMTSToken {
        const section = this.findSectionByType<AccountTokenIssuanceSectionSchema>(SectionType.ACCOUNT_TOKEN_ISSUANCE);
        return CMTSToken.createAtomic(section.getData().amount);
    }

    getAccountCreation(): AccountCreation {
        const section = this.findSectionByType<AccountCreationSectionSchema>(SectionType.ACCOUNT_CREATION);
        const data = section.getData();
        return new class extends AccountCreation {
            getAmount(): CMTSToken {
                return CMTSToken.createAtomic(data.amount);
            }

            getSellerAccount(): Hash {
                return Hash.from(data.sellerAccount);
            }
        }
    }

    getTransfer(): AccountTransfer  {
        const section = this.findSectionByType<AccountTransferSectionSchema>(SectionType.ACCOUNT_TRANSFER);
        const data = section.getData();
        return new class extends AccountTransfer {
            getAccount(): Hash {
                return Hash.from(data.account);
            }

            getAmount(): CMTSToken {
                return CMTSToken.createAtomic(data.amount)
            }

            getPublicReference(): string {
                return data.publicReference
            }

            getPrivateReference(): string {
                return data.privateReference;
            }
        }
    }

    getSignature(): Uint8Array {
        const section = this.findSectionByType<AccountSignatureSectionSchema>(SectionType.ACCOUNT_SIGNATURE);
        return section.getData().signature;
    }
}

// --------------------------------------------------------------------------------------------------------------------
// AppLedger

export abstract class ActorCreation {
    abstract getId(): number;

    abstract getType(): number;

    abstract getName(): string;
}

export abstract class ChannelCreation {
    abstract getId(): number;

    abstract isPrivate(): boolean;

    abstract getCreatorId(): number;

    abstract getName(): string;
}

export abstract class SharedSecret {
    abstract getHostId(): number;

    abstract getGuestId(): number;

    abstract getEncapsulation(): Uint8Array;
}

export abstract class ChannelInvitation {
    abstract getChannelId(): number;

    abstract getHostId(): number;

    abstract getGuestId(): number;

    abstract getChannelKey(): Uint8Array;
}

export abstract class ActorSubscription {
    abstract getActorId(): number;

    abstract getActorType(): number;

    abstract getOrganizationId(): Uint8Array;

    abstract getKemPublicKey(): Uint8Array;

    abstract getSignaturePublicKey(): Uint8Array;
}

export abstract class PublicChannelData {
    abstract getChannelId(): number;
    abstract getData(): Uint8Array;
}

export abstract class PrivateChannelData {
    abstract getChannelId(): number;
    abstract getMerkleRootHash(): Hash;
    abstract getEncryptedData(): Uint8Array;
}

export class AppLedgerMicroBlock extends AbstractMicroBlock {
    getSectionConstraints(): MicroBlockSectionConstraint {
        const constraints = new MicroBlockSectionConstraint();
        constraints.addExactlyOneSectionConstraint(SectionType.APP_LEDGER_ENDORSER);
        constraints.addExactlyOneSectionConstraint(SectionType.APP_LEDGER_AUTHOR);
        constraints.addExactlyOneSectionConstraint(SectionType.APP_LEDGER_ENDORSER_SIGNATURE);
        constraints.addExactlyOneSectionConstraint(SectionType.APP_LEDGER_AUTHOR_SIGNATURE);

        return constraints
    }

    getMicroBlockType(): MicroBlockType {
        return MicroBlockType.APP_LEDGER_MICROBLOCK
    }

    protected encodeBody(): Uint8Array {
        return new Uint8Array(0);
    }

    getEndorserId(): number {
        const section = this.findSectionByType<AppLedgerEndorserSectionSchema>(SectionType.APP_LEDGER_ENDORSER);
        const data = section.getData();
        return data.endorserId;
    }

    getAuthorId(): number {
        const section = this.findSectionByType<AppLedgerAuthorSectionSchema>(SectionType.APP_LEDGER_AUTHOR);
        const data = section.getData();
        return data.authorId;
    }

    getAuthorSignature(): Uint8Array {
        const section = this.findSectionByType<AppLedgerAuthorSignatureSectionSchema>(SectionType.APP_LEDGER_AUTHOR_SIGNATURE);
        const data = section.getData();
        return data.signature;
    }

    getEndorserSignature(): Uint8Array {
        const section = this.findSectionByType<AppLedgerEndorserSignatureSectionSchema>(SectionType.APP_LEDGER_ENDORSER_SIGNATURE);
        const data = section.getData();
        return data.signature;
    }

    getSignatureAlgorithm(): SignatureAlgorithmId {
        const section = this.findSectionByType<AppLedgerSigAlgorithmSectionSchema>(SectionType.APP_LEDGER_SIG_ALGORITHM);
        return section.getData().algorithmId;
    }

    getDeclaration(): Uint8Array {
        const section = this.findSectionByType<AppLedgerDeclarationSectionSchema>(SectionType.APP_LEDGER_DECLARATION);
        return section.getData().applicationId;
    }

    getActorCreation(): ActorCreation {
        const section = this.findSectionByType<AppLedgerActorCreationSectionSchema>(SectionType.APP_LEDGER_ACTOR_CREATION);
        const data = section.getData();
        return new class extends ActorCreation {
            getId = () => data.id;
            getType = () => data.type;
            getName = () => data.name;
        };
    }

    getChannelCreation(): ChannelCreation {
        const section = this.findSectionByType<AppLedgerChannelCreationSectionSchema>(SectionType.APP_LEDGER_CHANNEL_CREATION);
        const data = section.getData();
        return new class extends ChannelCreation {
            getId = () => data.id;
            isPrivate = () => data.isPrivate;
            getCreatorId = () => data.creatorId;
            getName = () => data.name;
        };
    }

    getSharedSecret(): SharedSecret {
        const section = this.findSectionByType<AppLedgerSharedSecretSectionSchema>(SectionType.APP_LEDGER_SHARED_SECRET);
        const data = section.getData();
        return new class extends SharedSecret {
            getHostId = () => data.hostId;
            getGuestId = () => data.guestId;
            getEncapsulation = () => data.encapsulation;
        };
    }

    getChannelInvitation(): ChannelInvitation {
        const section = this.findSectionByType<AppLedgerChannelInvitationSectionSchema>(SectionType.APP_LEDGER_CHANNEL_INVITATION);
        const data = section.getData();
        return new class extends ChannelInvitation {
            getChannelId = () => data.channelId;
            getHostId = () => data.hostId;
            getGuestId = () => data.guestId;
            getChannelKey = () => data.channelKey;
        };
    }

    getActorSubscription(): ActorSubscription {
        const section = this.findSectionByType<AppLedgerActorSubscriptionSectionSchema>(SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION);
        const data = section.getData();
        return new class extends ActorSubscription {
            getActorId = () => data.actorId;
            getActorType = () => data.actorType;
            getOrganizationId = () => data.organizationId;
            getKemPublicKey = () => data.kemPublicKey;
            getSignaturePublicKey = () => data.signaturePublicKey;
        };
    }

    getPublicChannelData(): PublicChannelData {
        const section = this.findSectionByType<AppLedgerPublicChannelDataSectionSchema>(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA);
        const data = section.getData();
        return new class extends PublicChannelData {
            getChannelId =  () => data.channelId
            getData = () => data.data
        }
    }

    getPrivateChannelData(): PrivateChannelData {
        const section = this.findSectionByType<AppLedgerPrivateChannelDataSectionSchema>(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA);
        const data = section.getData();
        return new class extends PrivateChannelData {
            getChannelId =  () => data.channelId
            getEncryptedData = () => data.encryptedData
            getMerkleRootHash = () => Hash.from(data.merkleRootHash)
        }
    }


}
