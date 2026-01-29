import {Record} from './Record';
import {
    Path,
    TypeEnum,
    Item,
    FlatItem,
    ArrayItem,
    ObjectItem,
} from './types';

export class FlattenedRecord {
    private channelMap: Map<number, FlatItem[]>;

    constructor() {
        this.channelMap = new Map;
    }

    fromRecord(record: Record) {
        this.channelMap.clear();
        const tree = record.getTree();
        this.flattenByDfs(tree, []);
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

    private flattenByDfs(item: Item, path: Path) {
        switch (item.type) {
            case TypeEnum.Array: {
                const value = (item as ArrayItem).value;
                value.forEach((item, index) => this.flattenByDfs(item, [...path, index]));
                break;
            }
            case TypeEnum.Object: {
                const value = (item as ObjectItem).value;
                for (const entry of value) {
                    this.flattenByDfs(entry.value, [...path, entry.key]);
                }
                break;
            }
            default: {
                const channelId = item.channelId;
                let flatItems = this.channelMap.get(channelId);

                if (flatItems === undefined) {
                    flatItems = [];
                    this.setChannel(channelId, flatItems);
                }

                flatItems.push({
                    path,
                    item,
                });
                break;
            }
        }
    }
}
