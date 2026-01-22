import {decode, encode} from 'cbor-x';
import {FlattenedRecord} from './FlattenedRecord';
import {SaltShaker} from './SaltShaker';
import {Crypto} from '../crypto/crypto';
import {
    TypeEnum,
    TransformationTypeEnum,
    FlatItemType,
    MerkleLeafTypeEnum,
    MerkleLeafDataType,
    MerkleLeafPlainType,
    MerkleLeafHashedType,
    MerkleLeafMaskedPartsType,
    MerkleLeafMaskedType,
    MerkleLeafType,
} from './types';

export class MerkleRecord {
    constructor() {
    }

    fromFlattenedRecord(flattenedRecord: FlattenedRecord) {
        const lists = flattenedRecord.getLists();

        for (const [ channelId, list ] of lists) {
            this.serializeChannel(list);
        }
    }

    private serializeChannel(list: FlatItemType[]) {
        const pepper = SaltShaker.generatePepper();
        const saltShaker = new SaltShaker(pepper);

        for (const entry of list) {
            const item = entry.item;
            const transformationType = item.type == TypeEnum.String ? item.transformation.type : TransformationTypeEnum.None;
            let data: MerkleLeafDataType;

            switch (transformationType) {
                case TransformationTypeEnum.None: {
                    data = this.getPlainLeafData(saltShaker, entry);
                    break;
                }
                case TransformationTypeEnum.Hashable: {
                    data = this.getHashedLeafData(saltShaker, entry);
                    break;
                }
                case TransformationTypeEnum.Maskable: {
                    data = this.getMaskedLeafData(saltShaker, entry);
                    break;
                }
                default: {
                    throw new Error(`unsupported transformation type '${transformationType}'`);
                }
            }
            const leaf: MerkleLeafType = {
                path: entry.path,
                data,
            };
            const encodedLeaf = encode(leaf);
            console.log(leaf, encodedLeaf);
        }
    }

    private getPlainLeafData(saltShaker: SaltShaker, entry: FlatItemType): MerkleLeafPlainType {
        return {
            type: MerkleLeafTypeEnum.Plain,
            salt: saltShaker.getSalt(),
            value: entry.item.value,
        };
    }

    private getHashedLeafData(saltShaker: SaltShaker, entry: FlatItemType): MerkleLeafHashedType {
        const serializedValue = encode(entry.item.value);

        return {
            type: MerkleLeafTypeEnum.Hashed,
            salt: saltShaker.getSalt(),
            hash: Crypto.Hashes.sha512AsBinary(serializedValue),
        };
    }

    private getMaskedLeafData(saltShaker: SaltShaker, entry: FlatItemType): MerkleLeafMaskedType {
        const visibleParts: MerkleLeafMaskedPartsType = {
            salt: saltShaker.getSalt(),
            parts: entry.item.transformation.visibleParts,
        };
        const hiddenParts: MerkleLeafMaskedPartsType = {
            salt: saltShaker.getSalt(),
            parts: entry.item.transformation.hiddenParts,
        };
        const serializedVisibleParts = encode(visibleParts);
        const serializedHiddenParts = encode(visibleParts);

        return {
            type: MerkleLeafTypeEnum.Masked,
            visibleHash: Crypto.Hashes.sha512AsBinary(serializedVisibleParts),
            hiddenHash: Crypto.Hashes.sha512AsBinary(serializedHiddenParts),
        };
    }
}
