import * as v from 'valibot';
import {uint8array} from "../type/valibot/primitives";

export type JsonData =
    | string
    | number
    | boolean
    | null
    | JsonData[]
    | { [key: string]: JsonData };

export const JsonSchema: v.GenericSchema<JsonData> = v.lazy(() =>
    v.union([
        v.string(),
        v.number(),
        v.boolean(),
        v.null(),
        v.array(JsonSchema),
        v.record(v.string(), JsonSchema),
    ])
);

export type JsonType = v.InferOutput<typeof JsonSchema>;

export enum TransformationTypeEnum {
    None = 0,
    Hashable = 1,
    Maskable = 2,
}

const TransformationNoneSchema = v.object({
    type: v.literal(TransformationTypeEnum.None),
});

const TransformationHashableSchema = v.object({
    type: v.literal(TransformationTypeEnum.Hashable),
});

const TransformationMaskableSchema = v.object({
    type: v.literal(TransformationTypeEnum.Maskable),
    visibleParts: v.array(v.string()),
    hiddenParts: v.array(v.string()),
});

const TransformationSchema = v.variant(
    'type',
    [
        TransformationNoneSchema,
        TransformationHashableSchema,
        TransformationMaskableSchema,
    ]
);

export enum TypeEnum {
    String = 0,
    Number = 1,
    Boolean = 2,
    Null = 3,
    Array = 4,
    Object = 5,
}

let ItemSchema: v.GenericSchema<any>;

const PrimitiveItemFields = {
    channelId: v.number(),
};

const StringItemSchema = v.object({
    type: v.literal(TypeEnum.String),
    value: v.string(),
    transformation: TransformationSchema,
    ...PrimitiveItemFields,
});

export type StringItemType = v.InferOutput<typeof StringItemSchema>;

const NumberItemSchema = v.object({
    type: v.literal(TypeEnum.Number),
    value: v.number(),
    ...PrimitiveItemFields,
});

export type NumberItemType = v.InferOutput<typeof NumberItemSchema>;

const BooleanItemSchema = v.object({
    type: v.literal(TypeEnum.Boolean),
    value: v.boolean(),
    ...PrimitiveItemFields,
});

export type BooleanItemType = v.InferOutput<typeof BooleanItemSchema>;

const NullItemSchema = v.object({
    type: v.literal(TypeEnum.Null),
    ...PrimitiveItemFields,
});

export type NullItemType = v.InferOutput<typeof NullItemSchema>;

const ArrayItemSchema = v.object({
    type: v.literal(TypeEnum.Array),
    value: v.array(v.lazy(() => ItemSchema)),
});

export type ArrayItemType = v.InferOutput<typeof ArrayItemSchema>;

const ObjectItemSchema = v.object({
    type: v.literal(TypeEnum.Object),
    value: v.array(
        v.object({
            key: v.string(),
            value: v.lazy(() => ItemSchema)
        })
    ),
});

export type ObjectItemType = v.InferOutput<typeof ObjectItemSchema>;

ItemSchema = v.variant(
    'type',
    [
        StringItemSchema,
        NumberItemSchema,
        BooleanItemSchema,
        NullItemSchema,
        ArrayItemSchema,
        ObjectItemSchema,
    ]
);

export type ItemType = v.InferOutput<typeof ItemSchema>;

export type FlatItemType = {
    path: string[],
    item: ItemType
};

export enum MerkleLeafTypeEnum {
    Plain = 0,
    Hashed = 1,
    Masked = 2,
}

const MerkleLeafPrimitiveSchema = v.union([
    v.string(),
    v.number(),
    v.boolean(),
    v.null(),
]);

export type MerkleLeafPrimitiveType = v.InferOutput<typeof MerkleLeafPrimitiveSchema>;

const MerkleLeafPlainSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Plain),
    salt: v.instance(Uint8Array),
    value: MerkleLeafPrimitiveSchema,
});

export type MerkleLeafPlainType = v.InferOutput<typeof MerkleLeafPlainSchema>;

const MerkleLeafHashedSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Hashed),
    salt: v.instance(Uint8Array),
    hash: uint8array(),
});

export type MerkleLeafHashedType = v.InferOutput<typeof MerkleLeafHashedSchema>;

const MerkleLeafMaskedPartsSchema = v.object({
    salt: uint8array(),
    parts: v.array(v.string()),
});

export type MerkleLeafMaskedPartsType = v.InferOutput<typeof MerkleLeafMaskedPartsSchema>;

const MerkleLeafMaskedSchema = v.object({
    type: v.literal(MerkleLeafTypeEnum.Masked),
    visibleHash: uint8array(),
    hiddenHash: uint8array(),
});

export type MerkleLeafMaskedType = v.InferOutput<typeof MerkleLeafMaskedSchema>;

const MerkleLeafDataSchema = v.variant(
    'type',
    [
        MerkleLeafPlainSchema,
        MerkleLeafHashedSchema,
        MerkleLeafMaskedSchema,
    ]
);

export type MerkleLeafDataType = v.InferOutput<typeof MerkleLeafDataSchema>;

const MerkleLeafSchema = v.object({
    path: v.array(v.string()),
    data: MerkleLeafDataSchema,
});

export type MerkleLeafType = v.InferOutput<typeof MerkleLeafSchema>;
