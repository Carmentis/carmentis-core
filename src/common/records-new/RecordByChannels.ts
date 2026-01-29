import {Record} from './Record';
import {
    FlatItem,
} from './types';

export class RecordByChannels {
    private channelMap: Map<number, FlatItem[]>;

    constructor() {
        this.channelMap = new Map;
    }

    fromRecord(record: Record) {
        this.channelMap.clear();
        const list = record.getItemList();
        for (const flatItem of list) {
            const channelId = flatItem.item.channelId;
            let flatItems = this.channelMap.get(channelId);
            if (flatItems === undefined) {
                flatItems = [];
                this.setChannel(channelId, flatItems);
            }
            flatItems.push(flatItem);
        }
    }

    setChannel(channelId: number, flatItems: FlatItem[]) {
        this.channelMap.set(channelId, flatItems);
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
