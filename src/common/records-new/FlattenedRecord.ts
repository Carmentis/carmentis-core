import { Record } from './Record';
import {
    TypeEnum,
    ItemType,
    FlatItemType,
    ArrayItemType,
    ObjectItemType,
} from './types';

export class FlattenedRecord {
    private lists: Map<number, FlatItemType[]>;

    constructor() {
        this.lists = new Map;
    }

    fromRecord(record: Record) {
        this.lists = new Map;
        const tree = record.getTree();
        this.flattenByDfs(tree, []);

        for (const [ channelId, list ] of this.lists) {
            console.log(channelId, JSON.stringify(list, null, 2));
        }
    }

    getLists() {
        return this.lists;
    }

    private flattenByDfs(item: ItemType, path: string[]) {
        switch (item.type) {
            case TypeEnum.Array: {
                const value = (item as ArrayItemType).value;
                value.forEach((item, index) => this.flattenByDfs(item, [...path, index.toString()]));
                break;
            }
            case TypeEnum.Object: {
                const value = (item as ObjectItemType).value;
                for (const entry of value) {
                    this.flattenByDfs(entry.value, [...path, entry.key]);
                }
                break;
            }
            default: {
                const channelId = item.channelId;
                let list = this.lists.get(channelId);

                if (list === undefined) {
                    list = [];
                    this.lists.set(channelId, list);
                }

                list.push({
                    path,
                    item,
                });
                break;
            }
        }
    }
}
