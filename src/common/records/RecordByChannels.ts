import {Record} from './Record';
import {
    FlatItem,
} from './types';

export class RecordByChannels {
    private channelMap: Map<number, FlatItem[]>;
    private publicChannels: Set<number>;

    constructor() {
        this.channelMap = new Map;
        this.publicChannels = new Set;
    }

    fromRecord(record: Record) {
        this.channelMap.clear();
        this.publicChannels = record.getPublicChannels();
        const list = record.getItemList();
        for (const flatItem of list) {
            const channelId = flatItem.item.channelId;
            let flatItems = this.channelMap.get(channelId);
            if (flatItems === undefined) {
                flatItems = [];
                this.channelMap.set(channelId, flatItems);
            }
            flatItems.push(flatItem);
        }
    }

    setChannel(channelId: number, isPublic: boolean, flatItems: FlatItem[]) {
        if (isPublic) {
            this.publicChannels.add(channelId);
        }
        else {
            this.publicChannels.delete(channelId);
        }
        this.channelMap.set(channelId, flatItems);
    }

    getPublicChannels() {
        return this.publicChannels;
    }

    getChannelIds() {
        return [...this.channelMap.keys()].sort((a, b) => a - b);
    }

    getFlatItems(channelId: number) {
        const flatItems = this.channelMap.get(channelId);
        if (flatItems == undefined) {
            throw new Error(`Channel ${channelId} not found`);
        }
        return flatItems;
    }
}
