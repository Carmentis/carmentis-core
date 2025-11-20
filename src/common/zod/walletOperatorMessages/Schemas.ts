import {z} from 'zod';

export enum WalletOperatorMessageType {
    WALLET_OPERATOR_RESPONSE_ERROR = 'WALLET_OPERATOR_RESPONSE_ERROR',
    WALLET_OPERATOR_REQUEST_APPROVAL_HANDSHAKE = 'WALLET_OPERATOR_REQUEST_APPROVAL_HANDSHAKE',
    WALLET_OPERATOR_REQUEST_ACTOR_KEY = 'WALLET_OPERATOR_REQUEST_ACTOR_KEY',
    WALLET_OPERATOR_REQUEST_APPROVAL_SIGNATURE = 'WALLET_OPERATOR_REQUEST_APPROVAL_SIGNATURE',
    WALLET_OPERATOR_RESPONSE_ACTOR_KEY_REQUIRED = 'WALLET_OPERATOR_RESPONSE_ACTOR_KEY_REQUIRED',
    WALLET_OPERATOR_RESPONSE_APPROVAL_DATA = 'WALLET_OPERATOR_RESPONSE_APPROVAL_DATA',
    WALLET_OPERATOR_RESPONSE_APPROVAL_SIGNATURE = 'WALLET_OPERATOR_RESPONSE_APPROVAL_SIGNATURE'
}


export const WalletOperatorResponseErrorSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_RESPONSE_ERROR),
    errorCode: z.number(),
    errorMessage: z.string().optional().default("")
});

export const WalletOperatorRequestApprovalHandshakeSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_REQUEST_APPROVAL_HANDSHAKE),
    anchorRequestId: z.string()
});

export const WalletOperatorRequestActorKeySchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_REQUEST_ACTOR_KEY),
    anchorRequestId: z.string(),
    actorSignaturePublicKey: z.string(),
    actorPkePublicKey: z.string()
});

export const WalletOperatorRequestApprovalSignatureSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_REQUEST_APPROVAL_SIGNATURE),
    anchorRequestId: z.string(),
    signature: z.instanceof(Uint8Array)
});

export const WalletOperatorResponseActorKeyRequiredSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_RESPONSE_ACTOR_KEY_REQUIRED),
    genesisSeed: z.instanceof(Uint8Array)
});

export const WalletOperatorResponseApprovalDataSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_RESPONSE_APPROVAL_DATA),
    data: z.instanceof(Uint8Array)
});

export const WalletOperatorResponseApprovalSignatureSchema = z.object({
    type: z.literal(WalletOperatorMessageType.WALLET_OPERATOR_RESPONSE_APPROVAL_SIGNATURE),
    vbHash: z.instanceof(Uint8Array),
    mbHash: z.instanceof(Uint8Array),
    height: z.number()
});

export const WalletOperatorMessageSchema = z.discriminatedUnion("type", [
    WalletOperatorResponseErrorSchema,
    WalletOperatorRequestApprovalHandshakeSchema,
    WalletOperatorRequestActorKeySchema,
    WalletOperatorRequestApprovalSignatureSchema,
    WalletOperatorResponseActorKeyRequiredSchema,
    WalletOperatorResponseApprovalDataSchema,
    WalletOperatorResponseApprovalSignatureSchema
]);

export type WalletOperatorMessage = z.infer<typeof WalletOperatorMessageSchema>;
export type WalletOperatorResponseError = z.infer<typeof WalletOperatorResponseErrorSchema>;
export type WalletOperatorRequestApprovalHandshake = z.infer<typeof WalletOperatorRequestApprovalHandshakeSchema>;
export type WalletOperatorRequestActorKey = z.infer<typeof WalletOperatorRequestActorKeySchema>;
export type WalletOperatorRequestApprovalSignature = z.infer<typeof WalletOperatorRequestApprovalSignatureSchema>;
export type WalletOperatorResponseActorKeyRequired = z.infer<typeof WalletOperatorResponseActorKeyRequiredSchema>;
export type WalletOperatorResponseApprovalData = z.infer<typeof WalletOperatorResponseApprovalDataSchema>;
export type WalletOperatorResponseApprovalSignature = z.infer<typeof WalletOperatorResponseApprovalSignatureSchema>;
