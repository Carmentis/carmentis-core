import * as v from 'valibot';
import {
    JsonData,
    JsonSchema,
    JsonType,
    TransformationTypeEnum,
    TypeEnum,
    ItemType,
    StringItemType,
    NumberItemType,
    BooleanItemType,
    NullItemType,
    ArrayItemType,
    ObjectItemType,
} from './types';

export class Record {
    private tree: ItemType;

    constructor() {
        this.tree = this.buildNullItem();
    }

    fromJson(object: unknown) {
        const parsedObject = v.parse(JsonSchema, object);
        console.log(object);
        console.log(parsedObject);
        this.tree = this.buildTreeByDfs(parsedObject);
        console.log(JSON.stringify(this.tree, null, 2));
    }

    toJson() {
        return this.buildJsonByDfs(this.tree);
    }

    getTree() {
        return this.tree;
    }

    private buildJsonByDfs(item: ItemType): JsonData {
        switch (item.type) {
            case TypeEnum.Array: {
                const value = (item as ArrayItemType).value;
                return value.map((item) => this.buildJsonByDfs(item));
            }
            case TypeEnum.Object: {
                const object: { [key: string]: any } = {};
                const value = (item as ObjectItemType).value;
                for (const entry of value) {
                    object[entry.key] = this.buildJsonByDfs(entry.value);
                }
                return object;
            }
            default: {
                return item.value;
            }
        }
    }

    private buildTreeByDfs(field: JsonType): ItemType {
        if (typeof field == 'string') {
            return this.buildStringItem(field);
        }
        if (typeof field == 'number') {
            return this.buildNumberItem(field);
        }
        if (typeof field == 'boolean') {
            return this.buildBooleanItem(field);
        }
        if (field === null) {
            return this.buildNullItem();
        }
        if (Array.isArray(field)) {
            return this.buildArrayItem(field);
        }
        if (typeof field == 'object') {
            return this.buildObjectItem(field);
        }
        throw new Error('unsupported field type');
    }

    private buildStringItem(field: string): StringItemType {
        return {
            type: TypeEnum.String,
            value: field,
            transformation: { type: TransformationTypeEnum.None },
            channelId: -1,
        };
    }

    private buildNumberItem(field: number): NumberItemType {
        return {
            type: TypeEnum.Number,
            value: field,
            channelId: -1,
        };
    }

    private buildBooleanItem(field: boolean): BooleanItemType {
        return {
            type: TypeEnum.Boolean,
            value: field,
            channelId: -1,
        };
    }

    private buildNullItem(): NullItemType {
        return {
            type: TypeEnum.Null,
            channelId: -1,
        };
    }

    private buildArrayItem(field: ItemType[]): ArrayItemType {
        return {
            type: TypeEnum.Array,
            value: field.map((field) => this.buildTreeByDfs(field)),
        };
    }

    private buildObjectItem(field: { [key: string]: ItemType }): ObjectItemType {
        const value = Object.keys(field).map((key) => ({
            key,
            value: this.buildTreeByDfs(field[key]),
        }));
        return {
            type: TypeEnum.Object,
            value,
        };
    }
}
