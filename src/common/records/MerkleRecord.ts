import {Utils} from '../utils/utils';
import {MerkleLeaf} from "./MerkleLeaf";
import {MerkleTree} from "../trees/merkleTree";
import {RecordByChannels} from './RecordByChannels';
import {SaltShaker} from './SaltShaker';
import {PositionedLeaf} from './PositionedLeaf';
import {
    TypeEnum,
    TransformationTypeEnum,
    FlatItem,
    Item,
} from './types';

type ChannelMapEntry = {
    pepper: Uint8Array,
    positionedLeaves: PositionedLeaf[]
}

export class MerkleRecord {
    private channelMap: Map<number, ChannelMapEntry>;
    private recordByChannels: RecordByChannels | undefined;
    private publicChannels: Set<number>;

    constructor() {
        this.channelMap = new Map;
        this.publicChannels = new Set;
    }

    fromRecordByChannels(recordByChannels: RecordByChannels, peppers: Map<number, Uint8Array>|undefined = undefined) {
        this.channelMap.clear();
        this.publicChannels = recordByChannels.getPublicChannels();
        this.recordByChannels = recordByChannels;
        const channelIds = this.recordByChannels.getChannelIds();

        for (const channelId of channelIds) {
            const isPublic = this.publicChannels.has(channelId);
            const pepper =
                isPublic ?
                    Utils.getNullHash()
                :
                    peppers === undefined ?
                        SaltShaker.generatePepper()
                    :
                        peppers.get(channelId);
            if (pepper === undefined) {
                throw new Error(`no pepper specified for channel ${channelId}`);
            }
            const flatItemList = this.recordByChannels.getFlatItems(channelId);
            this.storeChannel(channelId, flatItemList, pepper);
        }
    }

    private storeChannel(channelId: number, flatItemList: FlatItem[], pepper: Uint8Array) {
        const positionedLeaves = this.flatItemsToPositionedLeaves(flatItemList, pepper);
        this.channelMap.set(
            channelId,
            { pepper, positionedLeaves }
        );
    }

    getPublicChannels() {
        return this.publicChannels;
    }

    getLeavesByChannelMap() {
        const leavesByChannelMap = new Map;

        for (const [ channelId, entry ] of this.channelMap) {
            leavesByChannelMap.set(channelId, entry.positionedLeaves);
        }
        return leavesByChannelMap;
    }

    getRecordByChannels() {
        const recordByChannels = this.recordByChannels;
        if(recordByChannels === undefined) {
            throw new Error(`recordByChannels is not set`);
        }
        return recordByChannels;
    }

    getChannelIds() {
        return [...this.channelMap.keys()].sort((a, b) => a - b);
    }

    getChannelPepper(channelId: number) {
        const channel = this.getChannel(channelId);
        return channel.pepper;
    }

    getChannelRootHash(channelId: number) {
        const channel = this.getChannel(channelId);
        if (this.publicChannels.has(channelId)) {
            return Utils.getNullHash();
        }
        const tree = new MerkleTree;

        for (const obj of channel.positionedLeaves) {
            const leafHash = obj.leaf.getHash();
            tree.addLeaf(leafHash);
        }

        tree.finalize();
        const rootHash = tree.getRootHash();
        return rootHash;
    }

    private getChannel(channelId: number) {
        const channel = this.channelMap.get(channelId);
        if (channel === undefined) {
            throw new Error(`channel ${channelId} not found`);
        }
        return channel;
    }

    private flatItemsToPositionedLeaves(flatItemList: FlatItem[], pepper: Uint8Array) {
        const saltShaker = new SaltShaker(pepper);
        const positionedLeaves = flatItemList.map((flatItem, index) => ({
            leaf: this.flatItemToLeaf(saltShaker, flatItem.item),
            index,
            path: flatItem.path,
        }));
        return positionedLeaves;
    }

    private flatItemToLeaf(saltShaker: SaltShaker, item: Item) {
        const leaf = new MerkleLeaf();
        const transformationType =
            item.type == TypeEnum.String ?
                item.transformation.type
            :
                TransformationTypeEnum.None;

        switch (transformationType) {
            case TransformationTypeEnum.None: {
                leaf.setPlainDataFromItem(saltShaker, item);
                break;
            }
            case TransformationTypeEnum.Hashable: {
                leaf.setHashedDataFromItem(saltShaker, item);
                break;
            }
            case TransformationTypeEnum.Maskable: {
                leaf.setMaskedDataFromItem(saltShaker, item);
                break;
            }
            default: {
                throw new Error(`unsupported transformation type ${transformationType}`);
            }
        }
        return leaf;
    }
}
