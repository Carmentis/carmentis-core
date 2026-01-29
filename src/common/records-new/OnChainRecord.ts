import * as v from "valibot";
import {Encoder, encode, decode} from "cbor-x";
import {Utils} from '../utils/utils';
import {RecordByChannels} from "./RecordByChannels";
import {MerkleRecord} from "./MerkleRecord";
import {Record} from "./Record";
import {
    OnChainChannel,
    OnChainItem,
    FlatItem,
    OnChainChannelSchema,
    OnChainItemListSchema,
} from "./types";

type ChannelMapEntry = {
    rootHash: Uint8Array,
    pepper: Uint8Array,
    onChainItems: OnChainItem[],
}

export class OnChainRecord {
    private channelMap: Map<number, ChannelMapEntry>;

    constructor() {
        this.channelMap = new Map;
    }

    fromMerkleRecord(merkleRecord: MerkleRecord) {
        this.channelMap.clear();
        const recordByChannels = merkleRecord.getRecordByChannels();
        const channelIds = merkleRecord.getChannelIds();

        for (const channelId of channelIds) {
            const pepper = merkleRecord.getChannelPepper(channelId);
            const rootHash = merkleRecord.getChannelRootHash(channelId);
            const flatItems = recordByChannels.getFlatItems(channelId);
            const onChainItems: OnChainItem[] = flatItems.map((flatItem) => {
                return {
                    path: flatItem.path,
                    value: flatItem.item.value,
                    ...flatItem.item.transformation ? {transformation: flatItem.item.transformation} : {}
                }
            });
            this.channelMap.set(
                channelId,
                {
                    rootHash,
                    pepper,
                    onChainItems,
                }
            );
        }
    }

    getOnChainData(channelId: number, pack = false) {
        const channel = this.getChannel(channelId);
        const encoder = new Encoder({pack});
        const encodedPayload = encoder.encode(channel.onChainItems);
        const onChainData: OnChainChannel = {
            pepper: channel.pepper,
            data: encodedPayload,
        };
        const encodedOnChainData = encode(onChainData);
        return {
            rootHash: channel.rootHash,
            data: encodedOnChainData,
        };
    }

    addOnChainData(channelId: number, rootHash: Uint8Array, encodedData: Uint8Array) {
        if (this.channelMap.has(channelId)) {
            throw new Error(`channel ${channelId} has already been set`);
        }
        const onChainData: OnChainChannel = decode(encodedData);
        v.parse(OnChainChannelSchema, onChainData);
        const pepper = onChainData.pepper;
        const onChainItems: OnChainItem[] = decode(onChainData.data);
        v.parse(OnChainItemListSchema, onChainItems);
        this.channelMap.set(
            channelId,
            {
                rootHash,
                pepper,
                onChainItems,
            }
        );
    }

    toMerkleRecord(checkHashes = true) {
        const recordByChannels = new RecordByChannels;
        const peppers: Map<number, Uint8Array> = new Map();
        for (const [ channelId, channel ] of this.channelMap) {
            const flatItems: FlatItem[] = channel.onChainItems.map((field: OnChainItem) => {
                const item = {
                    channelId,
                    type: Record.getPrimitiveValueType(field.value),
                    value: field.value,
                    ...field.transformation ? {transformation: field.transformation} : {},
                }
                return {
                    path: field.path,
                    item,
                };
            });
            recordByChannels.setChannel(channelId, flatItems);
            peppers.set(channelId, channel.pepper);
        }
        const merkleRecord = new MerkleRecord;
        merkleRecord.fromRecordByChannels(recordByChannels, peppers);

        // optionally check root hashes
        if (checkHashes) {
            for (const [channelId, channel] of this.channelMap) {
                const rootHash = merkleRecord.getChannelRootHash(channelId);
                if (!Utils.binaryIsEqual(rootHash, channel.rootHash)) {
                    throw new Error(
                        `inconsistent Merkle root hash for channel ${channelId} ` +
                        `(computed ${Utils.binaryToHexa(rootHash)}, ` +
                        `on-chain value is ${Utils.binaryToHexa(channel.rootHash)})`
                    )
                }
            }
        }
        return merkleRecord;
    }

    private getChannel(channelId: number) {
        const channel = this.channelMap.get(channelId);
        if (channel === undefined) {
            throw new Error(`channel ${channelId} not found`);
        }
        return channel;
    }
}
