import {z} from 'zod';

export enum SectionType {
    // Account
    ACCOUNT_SIG_ALGORITHM = 0,
    ACCOUNT_PUBLIC_KEY = 1,
    ACCOUNT_TOKEN_ISSUANCE = 2,
    ACCOUNT_CREATION = 3,
    ACCOUNT_TRANSFER = 4,
    ACCOUNT_SIGNATURE = 5,

    // Organization
    ORG_SIG_ALGORITHM = 100,
    ORG_PUBLIC_KEY = 101,
    ORG_DESCRIPTION = 102,
    ORG_SERVER = 103,
    ORG_SIGNATURE = 104,

    // Application
    APP_SIG_ALGORITHM = 200,
    APP_DECLARATION = 201,
    APP_DESCRIPTION = 202,
    APP_SIGNATURE = 203,

    // Application Ledger
    APP_LEDGER_SIG_ALGORITHM = 300,
    APP_LEDGER_DECLARATION = 301,
    APP_LEDGER_ACTOR_CREATION = 302,
    APP_LEDGER_CHANNEL_CREATION = 303,
    APP_LEDGER_SHARED_SECRET = 304,
    APP_LEDGER_CHANNEL_INVITATION = 305,
    APP_LEDGER_ACTOR_SUBSCRIPTION = 306,
    APP_LEDGER_PUBLIC_CHANNEL_DATA = 307,
    APP_LEDGER_PRIVATE_CHANNEL_DATA = 308,
    APP_LEDGER_AUTHOR = 309,
    APP_LEDGER_ENDORSER = 310,
    APP_LEDGER_ENDORSER_SIGNATURE = 311,
    APP_LEDGER_AUTHOR_SIGNATURE = 312,
}


export const AppSigAlgorithmSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_SIG_ALGORITHM),
    data: z.object({
        algorithmId: z.number(),
    }),
});

export const AppDeclarationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_DECLARATION),
    data: z.object({
        organizationId: z.instanceof(Uint8Array),
    }),
});

export const AppDescriptionSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_DESCRIPTION),
    data: z.object({
        name: z.string(),
        logoUrl: z.string(),
        homepageUrl: z.string(),
        description: z.string(),
    }),
});

export const AppSignatureSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_SIGNATURE),
    data: z.object({
        signature: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerSigAlgorithmSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_SIG_ALGORITHM),
    data: z.object({
        algorithmId: z.number(),
    }),
});

export const AppLedgerDeclarationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_DECLARATION),
    data: z.object({
        applicationId: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerActorCreationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_ACTOR_CREATION),
    data: z.object({
        id: z.number(),
        type: z.number(),
        name: z.string(),
    }),
});

export const AppLedgerChannelCreationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_CHANNEL_CREATION),
    data: z.object({
        id: z.number(),
        isPrivate: z.boolean(),
        creatorId: z.number(),
        name: z.string(),
    }),
});

export const AppLedgerSharedSecretSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_SHARED_SECRET),
    data: z.object({
        hostId: z.number(),
        guestId: z.number(),
        encapsulation: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerChannelInvitationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_CHANNEL_INVITATION),
    data: z.object({
        channelId: z.number(),
        hostId: z.number(),
        guestId: z.number(),
        channelKey: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerActorSubscriptionSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_ACTOR_SUBSCRIPTION),
    data: z.object({
        actorId: z.number(),
        actorType: z.number(),
        organizationId: z.instanceof(Uint8Array),
        kemPublicKey: z.instanceof(Uint8Array),
        signaturePublicKey: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerPublicChannelDataSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_PUBLIC_CHANNEL_DATA),
    data: z.object({
        channelId: z.number(),
        data: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerPrivateChannelDataSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_PRIVATE_CHANNEL_DATA),
    data: z.object({
        channelId: z.number(),
        merkleRootHash: z.instanceof(Uint8Array),
        encryptedData: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerAuthorSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_AUTHOR),
    data: z.object({
        authorId: z.number(),
    }),
});

export const AppLedgerEndorserSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_ENDORSER),
    data: z.object({
        endorserId: z.number(),
        messageId: z.number(),
    }),
});

export const AppLedgerEndorserSignatureSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_ENDORSER_SIGNATURE),
    data: z.object({
        signature: z.instanceof(Uint8Array),
    }),
});

export const AppLedgerAuthorSignatureSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.APP_LEDGER_AUTHOR_SIGNATURE),
    data: z.object({
        signature: z.instanceof(Uint8Array),
    }),
});

export const AccountSigAlgorithmSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_SIG_ALGORITHM),
    data: z.object({
        algorithmId: z.number(),
    }),
});

export const AccountPublicKeySchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_PUBLIC_KEY),
    data: z.object({
        publicKey: z.instanceof(Uint8Array),
    }),
});

export const AccountTokenIssuanceSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_TOKEN_ISSUANCE),
    data: z.object({
        amount: z.number(),
    }),
});

export const AccountCreationSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_CREATION),
    data: z.object({
        sellerAccount: z.instanceof(Uint8Array),
        amount: z.number(),
    }),
});

export const AccountTransferSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_TRANSFER),
    data: z.object({
        account: z.instanceof(Uint8Array),
        amount: z.number(),
        publicReference: z.string(),
        privateReference: z.string(),
    }),
});

export const AccountSignatureSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ACCOUNT_SIGNATURE),
    data: z.object({
        signature: z.instanceof(Uint8Array),
    }),
});

export const OrgSigAlgorithmSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ORG_SIG_ALGORITHM),
    data: z.object({
        algorithmId: z.number(),
    }),
});

export const OrgPublicKeySchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ORG_PUBLIC_KEY),
    data: z.object({
        publicKey: z.instanceof(Uint8Array),
    }),
});

export const OrgDescriptionSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ORG_DESCRIPTION),
    data: z.object({
        name: z.string(),
        city: z.string(),
        countryCode: z.string().length(2),
        website: z.string(),
    }),
});

export const OrgServerSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ORG_SERVER),
    data: z.object({
        endpoint: z.string(),
    }),
});

export const OrgSignatureSchemaSectionSchema = z.object({
    sectionType: z.literal(SectionType.ORG_SIGNATURE),
    data: z.object({
        signature: z.instanceof(Uint8Array),
    }),
});

export const SectionSchema = z.union([
    AppSigAlgorithmSchemaSectionSchema,
    AppDeclarationSchemaSectionSchema,
    AppDescriptionSchemaSectionSchema,
    AppSignatureSchemaSectionSchema,
    AppLedgerSigAlgorithmSchemaSectionSchema,
    AppLedgerDeclarationSchemaSectionSchema,
    AppLedgerActorCreationSchemaSectionSchema,
    AppLedgerChannelCreationSchemaSectionSchema,
    AppLedgerSharedSecretSchemaSectionSchema,
    AppLedgerChannelInvitationSchemaSectionSchema,
    AppLedgerActorSubscriptionSchemaSectionSchema,
    AppLedgerPublicChannelDataSchemaSectionSchema,
    AppLedgerPrivateChannelDataSchemaSectionSchema,
    AppLedgerAuthorSchemaSectionSchema,
    AppLedgerEndorserSchemaSectionSchema,
    AppLedgerEndorserSignatureSchemaSectionSchema,
    AppLedgerAuthorSignatureSchemaSectionSchema,
    AccountSigAlgorithmSchemaSectionSchema,
    AccountPublicKeySchemaSectionSchema,
    AccountTokenIssuanceSchemaSectionSchema,
    AccountCreationSchemaSectionSchema,
    AccountTransferSchemaSectionSchema,
    AccountSignatureSchemaSectionSchema,
    OrgSigAlgorithmSchemaSectionSchema,
    OrgPublicKeySchemaSectionSchema,
    OrgDescriptionSchemaSectionSchema,
    OrgServerSchemaSectionSchema,
    OrgSignatureSchemaSectionSchema,
]);
